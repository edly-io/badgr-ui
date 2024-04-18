import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'bg-badgecard',
	host: { class: '  badgeNewCard' },
	template: `
		<div class="badgePills badgestatus-{{ mostRelevantStatus }}" *ngIf="mostRelevantStatus">
			{{ mostRelevantStatus }}
		</div>

		<div class="badgeNewCard-body">
			<div class="badgeNewCard-image-wrap">
				<img
					class="badgeNewCard-image badgeimage-{{ mostRelevantStatus }}"
					[loaded-src]="badgeImage"
					[loading-src]="badgeLoadingImageUrl"
					[error-src]="badgeFailedImageUrl"
					width="110"
				/>
			</div>
			<div class="badgeNewCard-title-wrapper">
				<!--
				<a *ngIf="badgeSlug" class="badgeNewCard-title " [routerLink]="['../earned-badge', badgeSlug]">
				{{ badgeTitle }}
					مقدمة في تحليل البيانات
				</a> -->
				<a *ngIf="publicUrl" class="badgeNewCard-title  " [href]="publicUrl"> {{ badgeTitle }} </a>

				<a
					*ngIf="issuerSlug; else noIssuerSlug"
					class="badgeNewCard-issuer"
					[routerLink]="['../../public/issuers', issuerSlug]"
					>{{ issuerTitle }}</a
				>
				<ng-template #noIssuerSlug>
					<div class="badgeNewCard-issuer">
						{{ issuerTitle }}
					</div>
				</ng-template>
				<p class="badgeNewCard-desc" [truncatedText]="badgeDescription" [maxLength]="100"></p>
			</div>
		</div>
		<div class="badgeNewCard-footer">
			<div class="badgeNewCard-date">
				<span *ngIf="badgeClass" i18n>					
					Available since:
				</span>
				<time [date]="badgeIssueDate" format="mediumDate"></time>
			</div>
			<!-- Show Verify or Share Button unless public -->
			<button
				class="badgeNewCard-sharelink"
				*ngIf="!verifyUrl && !public && mostRelevantStatus !== 'pending'"
				(click)="shareClicked.emit($event)"
				i18n
			>
				Share
			</button>
			<a class="badgeNewCard-sharelink" *ngIf="verifyUrl" [href]="verifyUrl"> Verify </a>
		</div>
	`,
})
export class BgBadgecard {
	readonly badgeLoadingImageUrl = '../../../breakdown/static/images/badge-loading.svg';
	readonly badgeFailedImageUrl = '../../../breakdown/static/images/badge-failed.svg';
	@Input() badgeSlug: string;
	@Input() issuerSlug: string;
	@Input() publicUrl: string;
	@Input() badgeImage: string;
	@Input() badgeTitle: string;
	@Input() badgeDescription: string;
	@Input() badgeIssueDate: string;
	@Input() badgeClass: string;
	@Input() issuerTitle: string;
	@Input() mostRelevantStatus: 'expired' | 'new' | 'pending' | undefined;
	@Input() verifyUrl: string;
	@Input() public = false;
	@Output() shareClicked = new EventEmitter<MouseEvent>();
}
