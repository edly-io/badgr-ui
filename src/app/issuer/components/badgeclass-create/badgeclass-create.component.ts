import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';

import { SessionService } from '../../../common/services/session.service';
import { MessageService } from '../../../common/services/message.service';
import { Issuer } from '../../models/issuer.model';
import { IssuerManager } from '../../services/issuer-manager.service';
import { BadgrApiFailure } from '../../../common/services/api-failure';
import { CommonDialogsService } from '../../../common/services/common-dialogs.service';
import { BadgeClass } from '../../models/badgeclass.model';
import { AppConfigService } from '../../../common/app-config.service';
import { LinkEntry } from '../../../common/components/bg-breadcrumbs/bg-breadcrumbs.component';

@Component({
	templateUrl: 'badgeclass-create.component.html',
})
export class BadgeClassCreateComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	issuerSlug: string;
	issuer: Issuer;
	issuerLoaded: Promise<unknown>;
	breadcrumbLinkEntries: LinkEntry[] = [];
	scrolled = false;
	copiedBadgeClass: BadgeClass = null;

	@ViewChild('badgeimage', { static: false }) badgeImage;

	constructor(
		sessionService: SessionService,
		router: Router,
		route: ActivatedRoute,
		protected fb: FormBuilder,
		protected title: Title,
		protected messageService: MessageService,
		protected issuerManager: IssuerManager,
		// protected badgeClassManager: BadgeClassManager,
		private configService: AppConfigService,
		protected dialogService: CommonDialogsService
	) {
		// TODO: how does the creation work? If I set existingBadge in the Editor it overwrites the copied one...
		super(router, route, sessionService);
		title.setTitle(`Create Badge - ${this.configService.theme['serviceName'] || 'Badgr'}`);
		this.issuerSlug = this.route.snapshot.params['issuerSlug'];

		this.issuerLoaded = this.issuerManager.issuerBySlug(this.issuerSlug).then((issuer) => {
			this.issuer = issuer;
			this.breadcrumbLinkEntries = [
				{ title: 'Issuers', routerLink: ['/issuer'] },
				{ title: issuer.name, routerLink: ['/issuer/issuers', this.issuerSlug] },
				{ title: 'Create Badge' },
			];
		});
	}

	ngOnInit() {
		super.ngOnInit();
	}

	badgeClassCreated(promise: Promise<BadgeClass>) {
		promise.then(
			(badgeClass) => this.router.navigate(['issuer/issuers', this.issuerSlug, 'badges', badgeClass.slug]),
			(error) =>
				this.messageService.reportAndThrowError(
					`Unable to create Badge Class: ${BadgrApiFailure.from(error).firstMessage}`,
					error
				)
		);
	}
	creationCanceled() {
		this.router.navigate(['issuer/issuers', this.issuerSlug]);
	}

	@HostListener('window:scroll')
	onWindowScroll() {
		var top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

		if (top > this.badgeImage.componentElem.nativeElement.offsetTop) {
			this.scrolled = true;
		} else {
			this.scrolled = false;
		}
	}

	copyBadge() {
		this.dialogService.copyBadgeDialog.openDialog()
			.then((data: any) => { // TODO
				this.copiedBadgeClass = data
			})
			.catch((error) => console.log(error));
	}
}
