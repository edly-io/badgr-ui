import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthManager } from "./oauth-manager.service";
import { UserProfileManager } from './user-profile-manager.service';
import { ExternalToolsManager } from '../../externaltools/services/externaltools-manager.service';


@Injectable()
export class LoginManager {
    constructor(
		private router: Router,
        private oAuthManager: OAuthManager,
		private profileManager: UserProfileManager,
		private externalToolsManager: ExternalToolsManager,
	) {
	}
    

    loggedInSuccess(){
		this.profileManager.reloadUserProfileSet().then(() => {
			this.profileManager.userProfilePromise.then((profile) => {
				if (profile) {
					// fetch user profile and emails to check if they are verified
					profile.emails.updateList().then(() => {
						if (profile.isVerified) {
							if (this.oAuthManager.isAuthorizationInProgress) {
								this.router.navigate(['/auth/oauth2/authorize']);
							} else {
								this.externalToolsManager.externaltoolsList.updateIfLoaded();
								// catch localStorage.redirectUri
								if (localStorage.redirectUri) {
									const redirectUri = new URL(localStorage.redirectUri);
									localStorage.removeItem('redirectUri');
									window.location.replace(redirectUri.origin);
									return false;
								} else {
									// first time only do welcome
									this.router.navigate([
										localStorage.signup ? 'auth/welcome' : 'recipient',
									]);
								}
							}
						} else {
							this.router.navigate([
								'signup/success',
								{ email: profile.emails.entities[0].email },
							]);
						}
					});
				}
			});
		});
	}
}