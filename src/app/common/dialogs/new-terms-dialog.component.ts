import { Component, ElementRef, Renderer2 } from '@angular/core';
import { BaseDialog } from './base-dialog';
import { AppConfigService } from '../app-config.service';
import { UserProfileManager } from '../services/user-profile-manager.service';
import { UserProfile } from '../model/user-profile.model';

@Component({
	selector: 'new-terms-dialog',
	template: ` <dialog
		aria-labelledby="updatedTermsDialog"
		aria-describedby="dialog1Desc"
		class="dialog dialog-is-active l-dialog"
		role="dialog"
	>
		<div class="dialog-x-box o-container">
			<div class="l-flex l-flex-justifybetween u-padding-top2x u-padding-xaxis3x">
				<h2 id="updatedTermsDialog" class="u-text-body-bold-caps font-family-plex-blue" i18n>
					Updated Terms of Service
				</h2>
			</div>
			<div class="u-padding-all3x">
				<p class="u-text u-text-body u-margin-bottom2x font-family-plex-blue" i18n>
					We’ve updated our <a target="_blank" [href]="termsOfServiceLink">Terms of Service</a>.
				</p>

				<div class="u-background-light3 u-padding-all2x u-margin-bottom3x">
					<p class="u-text u-text-body" *ngIf="profile && profile.latestTermsDescription">
						{{ profile.latestTermsDescription }}
					</p>
				</div>

				<label class="checkbox checkbox-small u-margin-bottom3x gap-2" [class.checkbox-is-error]="isErrorState">
					<input name="terms" id="terms" type="checkbox" [(ngModel)]="agreedToTerms" />
					<span
						class="checkbox-x-text font-family-plex-gray p-0 d-flex  gap-1"
						style="    flex-direction: column;"
					>
						<div i18n>
							I have read and agree to the
							<a target="_blank" [href]="termsOfServiceLink">Terms of Service</a>.
						</div>
						<div *ngIf="isErrorState" class="checkbox-x-errortext font-family-plex-gray" i18n>
							Please read and agree to the Terms of Service if you want to continue.
						</div>
					</span>
				</label>

				<div class="l-flex l-flex-2x gap-2">
					<button class="primary-button" (click)="submitAgreement()" i18n>Continue</button>
					<button class="new-button-secondary" *ngIf="termsHelpLink" [href]="termsHelpLink" target="_blank" i18n>
						Need Help?
					</button>
				</div>
			</div>
		</div>
	</dialog>`,
})
export class NewTermsDialog extends BaseDialog {
	agreedToTerms = false;

	resolveFunc: () => void;
	rejectFunc: () => void;
	_agreedPromise: Promise<void> = null;

	hasSubmitted = false;

	profile: UserProfile;

	constructor(
		componentElem: ElementRef,
		renderer: Renderer2,
		private configService: AppConfigService,
		private profileManager: UserProfileManager
	) {
		super(componentElem, renderer);
	}

	get agreedPromise(): Promise<void> {
		if (!this._agreedPromise) {
			this._agreedPromise = new Promise((resolve, reject) => {
				this.resolveFunc = resolve;
				this.rejectFunc = reject;
			});
		}
		return this._agreedPromise;
	}

	get termsOfServiceLink() {
		return this.configService.theme['termsOfServiceLink'] || 'https://badgr.org/missing-terms';
	}

	get termsHelpLink() {
		return this.configService.theme['termsHelpLink'] || 'https://badgr.org/missing-terms-help';
	}

	get isErrorState(): boolean {
		return this.hasSubmitted && !this.agreedToTerms;
	}

	submitAgreement() {
		this.hasSubmitted = true;
		if (this.agreedToTerms) {
			const profile = this.profile ? this.profile : this.profileManager.userProfile;
			profile.agreeToLatestTerms().then((_) => {
				this.closeDialog();
				if (this.resolveFunc) {
					this.resolveFunc();
				}
			});
		}
	}

	openDialog() {
		this.profileManager.userProfilePromise.then((profile) => {
			this.profile = profile;
		});
		if (!this.isOpen) this.showModal();
	}

	closeDialog() {
		this.closeModal();
	}
}
