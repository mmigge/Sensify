import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ActionSheetController, AlertController, ActionSheetButton } from 'ionic-angular';
import { Metadata } from '../../../providers/model';
import { ApiProvider } from '../../../providers/api/api';
import { SensifyPage } from '../../../pages/sensify/sensify-page';
import { helpers } from "../../../providers/service/helpers";
import * as L from 'leaflet';

@Component({
    selector: 'sensify-page-settings',
    templateUrl: 'sensify-settings.html'
})
export class SensifySettingsPage {

    @Input()
    public metadata: Metadata;

    @Output()
    public onMetadataChange: EventEmitter<Metadata> = new EventEmitter();

    @Output()
    public onMessageChange: EventEmitter<string> = new EventEmitter();
    
    @Output()
    public onManualPositioningChange: EventEmitter<Boolean> = new EventEmitter();

    newRadius: number;
    newGpsDistance: number;
    newVerificationRange: number;
    newNotificationThresholdTemperatureMin: number;
    newNotificationThresholdTemperatureMax: number;
    newNotificationThresholduvIntensityMax: number;
    newSenseboxID: any;

    public senseBoxIDDelete: (string | ActionSheetButton)[] = [];
    public senseBoxIDSelect: (string | ActionSheetButton)[] = [];
    public setPositionManual: boolean;
    public manualLat;
    public manualLng;

    constructor(
        public mySensifyPage: SensifyPage,
        public alertCtrl: AlertController,
        public api: ApiProvider,
        public actionSheetCtrl: ActionSheetController,
        private helpers: helpers
    ) { }

    ngOnChanges(changes) {
        this.updateSenseBoxIDs();
    }

    // SETTINGS
    public changeSettings() {
        if (this.newRadius) {
            this.metadata.settings.radius = this.newRadius;
        }
        if (this.newGpsDistance) {
            this.metadata.settings.gpsDistance = this.newGpsDistance;
        }
        if (this.newVerificationRange) {
            this.metadata.settings.ranges.temperature = this.newVerificationRange;
        }
        if (this.newNotificationThresholdTemperatureMin) {
            this.metadata.settings.thresholds.temperature.min = this.newNotificationThresholdTemperatureMin;
        }
        if (this.newNotificationThresholdTemperatureMax) {
            this.metadata.settings.thresholds.temperature.max = this.newNotificationThresholdTemperatureMax;
        }
        if (this.newNotificationThresholduvIntensityMax) {
            this.metadata.settings.thresholds.uvIntensity.max = this.newNotificationThresholduvIntensityMax;
        }

        if (this.newRadius || this.newVerificationRange || this.newGpsDistance) {
            this.helpers.showAlert('Saved successfully', 'Settings are saved successfully');
            this.resetInputForms();
        }

        if (this.newNotificationThresholdTemperatureMin || this.newNotificationThresholdTemperatureMax || this.newNotificationThresholduvIntensityMax) {
            this.helpers.showAlert('Saved successfully', 'Thresholds saved successfully');
            this.resetInputForms();
        }
    }

    public changeSenseBoxIdManually() {
        if (this.newSenseboxID) {
            this.api.getSenseBoxByID(this.newSenseboxID).then(res => {
                if (res) {
                    this.metadata.closestSenseBox = res;
                    this.metadata.settings.mySenseBox = res._id;
                    let idx = -1;
                    if (this.metadata.settings.mySenseBoxIDs) {
                        idx = this.metadata.settings.mySenseBoxIDs.findIndex(el => el === res._id);
                    } else {
                        this.metadata.settings.mySenseBoxIDs = [];
                    }
                    if (idx < 0) {
                        this.metadata.settings.mySenseBoxIDs.push(res._id);
                    }
                    this.helpers.showAlert('ID saved successfully', 'New ID saved successfully');
                }
                this.resetInputFormsSenseBox();
            }).catch(err => {
                this.helpers.showAlert('ID not saved', '<br><b>The ID you have entered is not valid. Please try again</b><br><br>' + err.error.message);
            })
        } else {
            this.helpers.showAlert('No ID', 'Please enter a SenseBox ID to change home SenseBox manually.');
        }
    }

    /**
     * Function to reset input forms after setting changes
     */
    resetInputForms() {
        //Reset Input forms after setting change
        this.newRadius = null;
        this.newGpsDistance = null;
        this.newVerificationRange = null;
        this.newNotificationThresholdTemperatureMin = null;
        this.newNotificationThresholdTemperatureMax = null;
        this.newNotificationThresholduvIntensityMax = null;
        this.onMetadataChange.emit(this.metadata);
    }

    /**
     * Function to reset input forms for sensebox id after setting changes
     */
    resetInputFormsSenseBox() {
        this.newSenseboxID = null;
        this.onMetadataChange.emit(this.metadata);
    }

    /**
     * Function to remove all selected SenseBox IDs.
     */
    deleteSenseBoxIDs() {
        this.api.getclosestSenseBox(this.metadata.senseBoxes, this.metadata.settings.location).then(res => {
            this.metadata.closestSenseBox = res;
            this.newSenseboxID = null;
            this.metadata.settings.mySenseBoxIDs = [];
            delete this.metadata.settings.mySenseBox;
            this.senseBoxIDDelete = [];
            this.senseBoxIDSelect = [];
        });

        this.helpers.showAlert('All IDs deleted successfully', 'The SenseBox IDs have been deleted');
    }

    /**
     * Function to remove a provided ID from the selected SenseBoxes
     * @param id {String} id of the SenseBox that should be removed
     */
    deleteSenseBoxID(id: String) {
        this.api.getclosestSenseBox(this.metadata.senseBoxes, this.metadata.settings.location).then(res => {
            this.helpers.presentClosableToast('Deleting Sensebox');
            let idx = this.metadata.settings.mySenseBoxIDs.findIndex(el => el === id);
            // splice deleted id from sensebox array
            if (idx >= 0) {
                this.metadata.settings.mySenseBoxIDs.splice(idx, 1);
            } else {
                this.metadata.closestSenseBox = res;
                this.newSenseboxID = null;
                this.metadata.settings.mySenseBoxIDs = [];
                delete this.metadata.settings.mySenseBox;
            }
            // set new sensebox if exists, otherwise set to undefined
            if (id === this.metadata.settings.mySenseBox) {
                if (this.metadata.settings.mySenseBoxIDs.length > 0) {
                    this.metadata.settings.mySenseBox = this.metadata.settings.mySenseBoxIDs[0];
                    this.newSenseboxID = this.metadata.settings.mySenseBox;
                    let sensebox = this.metadata.senseBoxes.find(el => el._id === this.newSenseboxID);
                    if (sensebox) {
                        this.metadata.closestSenseBox = sensebox;
                    }
                } else {
                    this.newSenseboxID = null;
                    this.metadata.settings.mySenseBoxIDs = [];
                    delete this.metadata.settings.mySenseBox;
                }
            }
            this.onMetadataChange.emit(this.metadata);
            this.helpers.showAlert('ID removed successfully', 'The SenseBox ID has been removed');

            this.helpers.toastMSG.dismiss();
            this.helpers.toastMSG = null;
        })
    }

    /**
     * Function to choose one of the selected SenseBoxes
     * @param id {String} id to be displayed as home SenseBox
     */
    public selectSenseBoxID(id: String) {
        this.metadata.settings.mySenseBox = id;
        let sensebox = this.metadata.senseBoxes.find(el => el._id === id);
        if (sensebox) {
            this.metadata.closestSenseBox = sensebox;
        }
        this.helpers.showAlert('ID set', 'The SenseBox ID has been set');
        this.onMetadataChange.emit(this.metadata);
    }

    /** 
     * Function to create action sheet for choosing selected SenseBox and remove on of all selected SenseBoxes
     */
    public async updateSenseBoxIDs() {
        try {
            this.senseBoxIDDelete = [];
            this.senseBoxIDSelect = [];

            if (this.metadata.settings.mySenseBoxIDs && this.metadata.settings.mySenseBoxIDs.length > 0) {
                await Promise.all(this.metadata.settings.mySenseBoxIDs.map(async (id) => {
                    let sb = this.metadata.senseBoxes.find(el => el._id === id);
                    if (!sb) {
                        await this.api.getSenseBoxByID(id)
                            .then(box => {
                                sb = box;
                            });
                    }
                    let txt = id;
                    // set SenseBox name as selection text
                    if (sb) {
                        txt = sb.name;
                    }
                    let selected = false;
                    if (this.metadata.closestSenseBox && this.metadata.closestSenseBox._id === id) {
                        selected = true;
                    }
                    let actionSheetClass = selected ? 'selectedActionSheet' : 'unselectedActionSheet';
                    const senseBoxDeleteBtn: any = {
                        text: txt,
                        cssClass: actionSheetClass,
                        handler: () => {
                            this.deleteSenseBoxID(id);
                        }
                    };
                    this.senseBoxIDDelete.push(senseBoxDeleteBtn);
                    const senseBoxIDSelectBtn: any = {
                        text: txt,
                        cssClass: actionSheetClass,
                        handler: () => {
                            this.selectSenseBoxID(id);
                        }
                    };
                    this.senseBoxIDSelect.push(senseBoxIDSelectBtn);
                }));
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    /**
     * Function to open action sheet to select one of all selected SenseBoxes
     */
    public openSenseBoxIDSelection() {
        const actionSheet = this.actionSheetCtrl.create({
            title: 'Select SenseBoxID to display',
            buttons: this.senseBoxIDSelect,
        });
        actionSheet.present();
    }

    /**
     * Function to open action sheet to select one SenseBox which will be removed
     */
    public openSenseBoxIDDelete() {
        const actionSheet = this.actionSheetCtrl.create({
            title: 'Select SenseBoxID to remove',
            buttons: this.senseBoxIDDelete,
        });
        actionSheet.present();
    }

    public togglePositionManual() {
        console.log(this.metadata.settings.setPositionManual);
        // deactivate and activate auto GPS positioning
        this.onManualPositioningChange.emit(this.metadata.settings.setPositionManual);
    }

    public changeLocation() {
        let position: L.LatLng = this.metadata.settings.location;
        if (this.manualLat) {
            position.lat = this.manualLat;
        }
        if (this.manualLng) {
            position.lng = this.manualLng;
        }
        if (this.metadata.settings.setPositionManual) {
            this.metadata.settings.location = position;
            this.onMetadataChange.emit(this.metadata);
        } else {
            this.helpers.showAlert('Error', 'First, you need to enable manually position.');
        }
    }

    public selectClosestSenseBox() {
        this.api.getclosestSenseBox(this.metadata.senseBoxes, this.metadata.settings.location).then(res => {
            this.metadata.closestSenseBox = res;
        });
        this.helpers.showAlert('Selected Closest SenseBox!', 'You are now connected to the closest SenseBox.');
    }
}
