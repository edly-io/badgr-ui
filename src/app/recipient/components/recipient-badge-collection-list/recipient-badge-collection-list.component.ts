import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../../../common/services/message.service';
import { Title } from '@angular/platform-browser';
import { RecipientBadgeCollectionManager } from '../../services/recipient-badge-collection-manager.service';
import { RecipientBadgeCollection } from '../../models/recipient-badge-collection.model';
import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';
import { SessionService } from '../../../common/services/session.service';
import { RecipientBadgeManager } from '../../services/recipient-badge-manager.service';
import { CommonDialogsService } from '../../../common/services/common-dialogs.service';
import { shareCollectionDialogOptionsFor } from '../recipient-badge-collection-detail/recipient-badge-collection-detail.component';
import { AppConfigService } from '../../../common/app-config.service';

@Component({
	selector: 'recipient-badge-collection-list',
	templateUrl: './recipient-badge-collection-list.component.html',
	styleUrls: ['./recipient-badge-collection-list.component.scss'],
})
export class RecipientBadgeCollectionListComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly noCollectionsImageUrl =
		'../../../../assets/@concentricsky/badgr-style/dist/images/image-empty-collection.svg';
	readonly badgeLoadingImageUrl = '../../../../breakdown/static/images/badge-loading.svg';
	readonly badgeFailedImageUrl = '../../../../breakdown/static/images/badge-failed.svg';

	get badgeCollections(): RecipientBadgeCollection[] {
		return this.recipientBadgeCollectionManager.recipientBadgeCollectionList.entities;
	}

	collectionListLoaded: Promise<unknown>;
	
	plural = {
		issuer: {
			'=0':  $localize`No Issuers`,
			'=1':  $localize`1 Issuer`,
			other: $localize`# Issuers`,
		},
		badges: {
			'=0':  $localize`No Badges`,
			'=1':  $localize`1 Badge`,
			other:  $localize`# Badges`,
		},
		recipient: {
			'=0':  $localize`No Recipients`,
			'=1':  $localize`1 Recipient`,
			other:  $localize`# Recipients`,
		},
		collection: {
			'=0':  $localize`No Collection`,
			'=1':  $localize`1 Collection`,
			other:  $localize`# Collections`,
		},
	};

	constructor(
		router: Router,
		route: ActivatedRoute,
		loginService: SessionService,
		formBuilder: FormBuilder,
		private title: Title,
		private messageService: MessageService,
		private recipientBadgeCollectionManager: RecipientBadgeCollectionManager,
		private recipientBadgeManager: RecipientBadgeManager,
		private configService: AppConfigService,
		private dialogService: CommonDialogsService
	) {
		super(router, route, loginService);

		title.setTitle(`Collections - ${this.configService.theme['serviceName'] || 'Badgr'}`);

		this.collectionListLoaded = Promise.all([
			this.recipientBadgeCollectionManager.recipientBadgeCollectionList.loadedPromise,
			this.recipientBadgeManager.recipientBadgeList.loadedPromise,
		]);
	}

	togglePublishCollection(collection: RecipientBadgeCollection) {
		collection.published = !collection.published;

		if (collection.published) {
			collection.save().then(
				(success) =>
					this.messageService.reportMinorSuccess(`Published collection ${collection.name} successfully`),
				(failure) =>
					this.messageService.reportHandledError(`Failed to publish collection ${collection.name}`, failure)
			);
		} else {
			collection.save().then(
				(success) =>
					this.messageService.reportMinorSuccess(`Unpublished collection ${collection.name} successfully`),
				(failure) =>
					this.messageService.reportHandledError(
						`Failed to un-publish collection ${collection.name}`,
						failure
					)
			);
		}
	}

	shareCollection(collection: RecipientBadgeCollection) {
		this.dialogService.shareSocialDialog.openDialog(shareCollectionDialogOptionsFor(collection));
	}

	ngOnInit() {
		super.ngOnInit();
	}
}
