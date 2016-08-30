import { Component, EventEmitter, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { Router } from '@angular/router-deprecated';
import { FlogoInstallerCategorySelectorComponent } from '../../flogo.installer.category-selector/components/category-selector.component';
import { MODAL_DIRECTIVES, ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { FlogoInstallerTriggerComponent } from '../../flogo.installer.trigger-installer/components/trigger-installer.component';
import { FlogoInstallerActivityComponent } from '../../flogo.installer.activity-installer/components/activity-installer.component';
import { FlogoInstallerSearchComponent } from '../../flogo.installer.search/components/search.component';
import { FlogoInstallerUrlComponent } from '../../flogo.installer.url-installer/components/url-installer.component';
import { RESTAPITriggersService } from '../../../common/services/restapi/triggers-api.service';
import { RESTAPIActivitiesService } from '../../../common/services/restapi/activities-api.service';
import { notification } from '../../../common/utils';
import {
  FLOGO_INSTALLER_STATUS_STANDBY, FLOGO_INSTALLER_STATUS_IDLE,
  FLOGO_INSTALLER_STATUS_INSTALL_FAILED, FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS, FLOGO_INSTALLER_STATUS_INSTALLING
} from '../constants';

const ACTIVITY_TITLE = 'Download Tiles';
const TRIGGER_TITLE = 'Download Triggers';

@Component( {
  selector : 'flogo-installer',
  moduleId : module.id,
  directives : [
    MODAL_DIRECTIVES,
    FlogoInstallerSearchComponent,
    FlogoInstallerCategorySelectorComponent,
    FlogoInstallerActivityComponent,
    FlogoInstallerTriggerComponent,
    FlogoInstallerUrlComponent
  ],
  templateUrl : 'installer.tpl.html',
  inputs : [ 'installType: flogoInstallType', 'isActivated: flogoIsActivated' ],
  outputs : [
    'installTypeUpdate: flogoInstallTypeChange',
    'isActivatedUpdate: flogoIsActivatedChange',
    'onInstalled: flogoOnInstalled'
  ],
  styleUrls : [ 'installer.component.css' ]
} )
export class FlogoInstallerComponent implements OnChanges {

  @ViewChild( 'installerModal' ) modal : ModalComponent;

  installType : string;
  _installType : string;

  isActivated : boolean;
  _isActivated : boolean;
  isActivatedUpdate = new EventEmitter();
  onInstalled = new EventEmitter();

  _query = '';
  _title = '';

  _status = FLOGO_INSTALLER_STATUS_IDLE;

  // TODO
  //  may add two-way binding later.
  installTypeUpdate = new EventEmitter();

  constructor( private _router : Router,
    private _triggersAPIs : RESTAPITriggersService,
    private _activitiesAPIs : RESTAPIActivitiesService ) {
    this.init();
  }

  init() {
    console.log( 'Initialise Flogo Installer Component.' );

    this._status = FLOGO_INSTALLER_STATUS_STANDBY;
  }

  ngOnChanges( changes : {
    [key : string] : SimpleChange
  } ) {

    if ( _.has( changes, 'installType' ) ) {
      this.onInstallTypeChange( changes[ 'installType' ].currentValue );
    }

    if ( _.has( changes, 'isActivated' ) ) {
      this.onActivatedStatusChange( changes[ 'isActivated' ].currentValue );
    }

  }

  onInstallTypeChange( newVal ) {
    this._installType = newVal;

    switch ( this._installType ) {
      case 'activity':
        this._title = ACTIVITY_TITLE;
        break;
      case 'trigger':
        this._title = TRIGGER_TITLE;
        break;
      default:
        this._title = 'Install';
        break;
    }
  }

  onActivatedStatusChange( newVal ) {

    console.log( `Changed in FlogoInstallerComponent: ${newVal}` );

    if ( newVal !== this._isActivated ) {

      console.log( `Assigned.` );
      this._isActivated = newVal;

      if ( this._isActivated ) {
        this.openModal();
      }
    }
  }

  openModal() {
    console.log( 'Open Modal.' );
    this._status = FLOGO_INSTALLER_STATUS_STANDBY;
    this.modal.open();
  }

  closeModal() {
    console.log( 'Close Modal.' );
    this.modal.close();
  }

  onModalCloseOrDismiss() {
    console.log( 'On Modal Close.' );
    this._isActivated = false;
    this._status = FLOGO_INSTALLER_STATUS_IDLE;
    this.isActivatedUpdate.emit( false );
  }

  onInstallAction( url : string ) {
    console.group( `[FlogoInstallerComponent] onInstallAction` );
    console.log( `Source URL: ${url} ` );

    let installAPI = null;

    if ( this._installType === 'trigger' ) {
      installAPI = this._triggersAPIs.installTriggers.bind( this._triggersAPIs );
    } else if ( this._installType === 'activity' ) {
      installAPI = this._activitiesAPIs.installActivities.bind( this._activitiesAPIs );
    } else {
      console.warn( 'Unknown installation type.' );
      console.groupEnd();
      return;
    }

    let self = this;

    if ( _.isFunction( installAPI ) ) {

      self._status = FLOGO_INSTALLER_STATUS_INSTALLING;

      installAPI( [ url ] )
        .then( ( response )=> {
          console.group( `[FlogoInstallerComponent] onResponse` );
          if ( response.fail.length ) {
            notification( `${_.capitalize( self._installType )} installation failed.`, 'error' );
            console.error( `${_.capitalize( self._installType )} [ ${url} ] installation failed.` );
          } else {
            notification( `${_.capitalize( self._installType )} installed.`, 'success', 3000 );
            console.log( `${_.capitalize( self._installType )} [ ${url} ] installed.` );
          }
          console.groupEnd();
          return response;
        } )
        .then( ( response ) => {
          this.onInstalled.emit( response );
          self._status = FLOGO_INSTALLER_STATUS_INSTALL_SUCCESS;
          console.groupEnd();
          return response;
        } )
        .catch( ( err ) => {
          console.error( err );
          notification( `${_.capitalize( self._installType )} installation failed.`, 'error' );
          self._status = FLOGO_INSTALLER_STATUS_INSTALL_FAILED;
          console.groupEnd();
        } );
    } else {
      self._status = FLOGO_INSTALLER_STATUS_INSTALL_FAILED;
    }

  }
}