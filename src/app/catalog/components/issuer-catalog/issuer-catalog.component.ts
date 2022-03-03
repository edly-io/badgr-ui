import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../common/services/session.service';
import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';
import { MessageService } from '../../../common/services/message.service';
import { IssuerManager } from '../../../issuer/services/issuer-manager.service';
//import {BadgeClassManager} from '../../services/badgeclass-manager.service';
import { Issuer } from '../../../issuer/models/issuer.model';
//import {BadgeClass} from '../../models/badgeclass.model';
import { Title } from '@angular/platform-browser';
import { preloadImageURL } from '../../../common/util/file-util';
import { AppConfigService } from '../../../common/app-config.service';
import { BaseRoutableComponent } from '../../../common/pages/base-routable.component';
import { StringMatchingUtil } from '../../../common/util/string-matching-util';

import { Map, NavigationControl, Popup } from 'maplibre-gl';

@Component({
	selector: 'app-issuer-catalog',
	templateUrl: './issuer-catalog.component.html',
	styleUrls: ['./issuer-catalog.component.css'],
})
export class IssuerCatalogComponent extends BaseRoutableComponent implements OnInit, AfterViewInit {
	readonly issuerPlaceholderSrc = preloadImageURL(
		require('../../../../breakdown/static/images/placeholderavatar-issuer.svg') as string
	);
	readonly noIssuersPlaceholderSrc =
		require('../../../../../node_modules/@concentricsky/badgr-style/dist/images/image-empty-issuer.svg') as string;

	Array = Array;

	issuers: Issuer[] = null;
	//badges: BadgeClass[] = null;
	//issuerToBadgeInfo: {[issuerId: string]: IssuerBadgesInfo} = {};

	issuersLoaded: Promise<unknown>;
	//badgesLoaded: Promise<unknown>;
	issuerResults: Issuer[] = [];
	issuerResultsByCategory: MatchingIssuerCategory[] = [];
	order = 'asc';
	public badgesDisplay = 'grid';

	issuerGeoJson;

	private _searchQuery = "";
	get searchQuery() { return this._searchQuery; }
	set searchQuery(query) {
		this._searchQuery = query;
		// this.saveDisplayState();
		this.updateResults();
	}
	

	private _groupByCategory = false;
	get groupByCategory() {return this._groupByCategory;}
	set groupByCategory(val: boolean) {
		this._groupByCategory = val;
		this.updateResults();
	}

	get theme() {
		return this.configService.theme;
	}
	get features() {
		return this.configService.featuresConfig;
	}

	issuerKeys = {
		'schule': 'Schulen',
		'hochschule': 'Hochschulen und Universitäten',
		'andere': 'Andere (Bibliotheken, Museen, FabLabs, Unternehmen, Vereine, ...)',
		'n/a': 'Keine Angabe'
	}

	plural = {
		issuer: {
			'=0': 'Keine Institutionen',
			'=1': '1 Institution',
			other: '# Institutionen',
		},
		badges: {
			'=0': 'Keine Badges',
			'=1': '<strong class="u-text-bold">1</strong> Badge',
			other: '<strong class="u-text-bold">#</strong> Badges',
		},
		recipient: {
			'=0': 'Kein Empfänger',
			'=1': '1 Empfänger',
			other: '# Empfänger',
		},
	};

	mapObject;
	@ViewChild('map')
	private mapContainer: ElementRef<HTMLElement>;

	constructor(
		protected title: Title,
		protected messageService: MessageService,
		protected issuerManager: IssuerManager,
		protected configService: AppConfigService,
		//protected badgeClassService: BadgeClassManager,
		// loginService: SessionService,
		router: Router,
		route: ActivatedRoute
	) {
		super(router, route);
		title.setTitle(`Issuers - ${this.configService.theme['serviceName'] || 'Badgr'}`);

		// subscribe to issuer and badge class changes
		this.issuersLoaded = this.loadIssuers();
	}

	async loadIssuers() {
		let that = this;
		return new Promise(async (resolve, reject) => {
			this.issuerManager.getAllIssuers().subscribe(
				(issuers) => {
					this.issuers = issuers
						.slice()
						.filter((i) => i.apiModel.verified)
						.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
					this.issuerResults = this.issuers;
					this.issuerResults.sort((a,b) => a.name.localeCompare(b.name))
					this.mapObject.on('load', function(){
						that.generateGeoJSON(that.issuerResults)
					})
					resolve(issuers);
				},
				(error) => {
					this.messageService.reportAndThrowError('Failed to load issuers', error);
				}
			);
		});
	}

	ngOnInit() {
		super.ngOnInit();
	}

	ngAfterViewInit(){
		const myAPIKey = 'pk.eyJ1IjoidW11dDAwIiwiYSI6ImNrdXpoeDh3ODB5NzMydnFxMzI4eTlma3AifQ.SXH5fK6-sTOhrgWxiT10OQ'; 
		const mapStyle = 'mapbox://styles/mapbox/streets-v11';
	
		const initialState = { lng: 10.5, lat: 51, zoom: 5 };
		const style:any = {
			"version": 8,
			  "sources": {
			  "osm": {
					  "type": "raster",
					  "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
					  "tileSize": 256,
				"attribution": "&copy; OpenStreetMap Contributors",
				"maxzoom": 19
			  }
			},
			"layers": [
			  {
				"id": "osm",
				"type": "raster",
				"source": "osm" // This must match the source key above
			  }
			]
		  };
		this.mapObject = new Map({
		  container: this.mapContainer.nativeElement,
		  style: style,
		  center: [initialState.lng, initialState.lat],
		  zoom: initialState.zoom
		});
	
		this.mapObject.addControl(new NavigationControl());
		let that = this;
		this.mapObject.on('load', function () {
			// Add an image to use as a custom marker
			that.mapObject.loadImage(
			'https://maplibre.org/maplibre-gl-js-docs/assets/osgeo-logo.png',
			function (error, image) {
				if (error) throw error;
				that.mapObject.addImage('custom-marker', image);
			})
		})
	}

	private updateResults() {

		let that = this;
		// Clear Results
		this.issuerResults = [];
		this.issuerResultsByCategory = [];
		const issuerResultsByCategoryLocal = {};


		// var addIssuerToResults = function(item){
		// 	that.issuerResults.push(item);
		// }

		var addIssuerToResultsByCategory = function(item){

			that.issuerResults.push(item);
			
			let categoryResults = issuerResultsByCategoryLocal[item.category];
			
			if (!categoryResults) {
				categoryResults = issuerResultsByCategoryLocal[item.category] = new MatchingIssuerCategory(
					item.category,
					""
				);

				// append result to the issuerResults array bound to the view template.
				that.issuerResultsByCategory.push(categoryResults);
			}

			categoryResults.addIssuer(item);

			// if (!this.issuerResults.find(r => r.category === item)) {
			// 	// appending the results to the badgeResults array bound to the view template.
			// 	this.issuerResults.push(new BadgeResult(badge, issuerResults.issuer));
			// }

			return true;

		}
	


		// this.issuers
		// 	.filter(MatchingAlgorithm.issuerMatcher(this.searchQuery))
		// 	.forEach(addIssuerToResults);

		this.issuers
			.filter(MatchingAlgorithm.issuerMatcher(this.searchQuery))
			.forEach(addIssuerToResultsByCategory);

		this.issuerResults.sort((a,b) => a.name.localeCompare(b.name))
		this.issuerResultsByCategory.forEach(r => r.issuers.sort((a, b) => a.name.localeCompare(b.name)));
		this.generateGeoJSON(this.issuerResults)
	}

	generateGeoJSON(issuers){
		let featureCollection = [];
		issuers.forEach(issuer => {
			featureCollection.push({
				type: "Feature",
				properties: {
					name: issuer.name,
					slug: issuer.slug,
					description: issuer.description
				},
				geometry: {
					type: "Point",
					coordinates: [issuer.lon, issuer.lat]
				}
			})
		})

		this.issuerGeoJson = {
			type: "FeatureCollection",
			features: featureCollection
		}

		if(!this.mapObject.getSource('issuers')){
			this.mapObject.addSource('issuers', {
				'type': 'geojson',
				data: this.issuerGeoJson
			})
			this.mapObject.addLayer({
				'id': 'issuers',
				'type': 'circle',
				'source': 'issuers',
				// 'layout': {
				// 	'icon-image': 'custom-marker',
				// 	// get the year from the source's "year" property
				// 	// 'text-field': ['get', 'name'],
				// 	'text-font': ['Open Sans Bold'],  
				// 	'text-offset': [0, 1.25],
				// 	'text-anchor': 'top'
				// 	}
				"paint": {
					"circle-radius": 8,
					"circle-color": "#5b94c6",
				}
			});

			this.mapObject.on('click', 'issuers', (e) => {
				// Copy coordinates array.
				const coordinates = e.features[0].geometry.coordinates.slice();
				const name = e.features[0].properties.name;
				const slug = e.features[0].properties.slug;
				const desc = e.features[0].properties.description;
				 
				// Ensure that if the map is zoomed out such that multiple
				// copies of the feature are visible, the popup appears
				// over the copy being pointed to.
				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
				}
				 
				new Popup()
					.setLngLat(coordinates)
					.setHTML('<a href="public/issuers/'+slug+'">'+name+'</a><br><p>'+desc+'</p>')
					.addTo(this.mapObject);
				});
				 
				// Change the cursor to a pointer when the mouse is over the places layer.
				this.mapObject.on('mouseenter', 'issuers', () => {
					this.mapObject.getCanvas().style.cursor = 'pointer';
				});
				 
				// Change it back to a pointer when it leaves.
				this.mapObject.on('mouseleave', 'issuers', () => {
					this.mapObject.getCanvas().style.cursor = '';
				});

		} else {
			this.mapObject.getSource('issuers').setData(this.issuerGeoJson);
		}

	}

	changeOrder(order){
		if(order === 'asc'){
			this.issuerResults.sort((a,b) => a.name.localeCompare(b.name))
			this.issuerResultsByCategory.forEach(r => r.issuers.sort((a, b) => a.name.localeCompare(b.name)));

		} else {
			this.issuerResults.sort((a,b) => b.name.localeCompare(a.name))
			this.issuerResultsByCategory.forEach(r => r.issuers.sort((a, b) => b.name.localeCompare(a.name)));

		}
	}

	openMap(){
		this.badgesDisplay = 'map';
		let that = this;
		setTimeout(function(){
			that.mapObject.resize()
		},10)
	}
}


class MatchingAlgorithm {
	static issuerMatcher(inputPattern: string): (issuer) => boolean {
		const patternStr = StringMatchingUtil.normalizeString(inputPattern);
		const patternExp = StringMatchingUtil.tryRegExp(patternStr);

		return issuer => (
			StringMatchingUtil.stringMatches(issuer.name, patternStr, patternExp)
		);
	}
}


class MatchingIssuerCategory {
	constructor(
		public category: string,
		public issuer,
		public issuers: Issuer[] = []
	) {}

	addIssuer(issuer) {
		if (issuer.category === this.category) {
			if (this.issuers.indexOf(issuer) < 0) {
				this.issuers.push(issuer);
			}
		}
	}
}
