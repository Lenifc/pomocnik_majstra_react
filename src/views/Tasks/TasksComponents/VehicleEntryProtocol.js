import { Fieldset } from 'primereact/fieldset'
import { Calendar } from 'primereact/calendar'
import { InputText } from 'primereact/inputtext'
import { Checkbox } from 'primereact/checkbox'
import { MultiSelect } from 'primereact/multiselect'

import { useState, useEffect } from 'react'

import './VehicleEntryProtocol.css'

export default function VehicleEntryProtocol({protocolData, triggerProtocol}){

    
    const serviceReasons = [
        {value: 'Inspection'},
        {value: 'Mechanical diagnosis'},
        {value: 'Computer diagnosis'},
        {value: 'Engine service'},
        {value: 'Electric service'},
        {value: 'Oil service'},
        {value: 'Other mechanical service'},
        {value: 'Other'},
    ]
    
    const [vehicleProtocol, setVehicleProtocol] = useState({
        reciveDate: '',
        visualChecked: false,
        visualCheckNote: '',
        testDriveBefore: '',
        testDriveAfter: '',
        contactOnEveryChange: '',
        newPartsApprove: '',
        usedPartsApprove: '',
        onlyOriginalParts: '',
        hqReplacementsApprove: '',
        lqReplacementsApprove: '',
        clientMaxBudget: '',
        clientMaxBudgetNote: '',
        currentMileage: '',
        otherInfo: '',
        otherInfoTextarea: '',
        selectedServiceReasons: '',
    })
    
    useEffect(() => {
        if(protocolData) setVehicleProtocol(protocolData)
    }, [])

    useEffect(() =>{
        if(Object.keys(vehicleProtocol).length) triggerProtocol(vehicleProtocol)
    }, [vehicleProtocol])
    
    return (
        <Fieldset legend="Vehicle Acceptance Protocol" toggleable={true} collapsed={true} className="mb-3 text-center">
        <div className="flex flex-column lg:flex-row">
          <div style={{maxWidth:'500px'}}>
            <div className="field col-9">
              <label htmlFor="reciveTime">Vehicle taken from a client at: </label>
              <Calendar id="reciveTime" value={vehicleProtocol.reciveDate} onChange={(e) => setVehicleProtocol({...vehicleProtocol, reciveDate: e.target.value})} 
                        showTime="true" showIcon={true} hourFormat="24" showButtonBar={true} />
            </div>
            <div className="field-checkbox">
                <Checkbox id="visualCheck" checked={vehicleProtocol.visualChecked} onChange={(e) => setVehicleProtocol({...vehicleProtocol, visualChecked: e.checked})} binary={true} />
                <label htmlFor="visualCheck">Visual inspection before work</label>
            </div>
            { vehicleProtocol.visualChecked && <div className="field">
              <label htmlFor="visualCheckNote" className="mr-0 lg:mr-2">Notes: </label>
              <InputText id="visualCheckNote" type="text" value={vehicleProtocol.visualCheckNote} onChange={(e) => setVehicleProtocol({...vehicleProtocol, visualCheckNote: e.target.value})}/>
            </div>}
            <div className="field-checkbox">
                <Checkbox id="testDriveBefore" checked={vehicleProtocol.testDriveBefore} onChange={(e) => setVehicleProtocol({...vehicleProtocol, testDriveBefore: e.checked})} binary={true} />
                <label htmlFor="testDriveBefore">Client agreed for a test drive verification</label>
            </div>
            <div className="field-checkbox">
                <Checkbox id="testDriveAfter" checked={vehicleProtocol.testDriveAfter} onChange={(e) => setVehicleProtocol({...vehicleProtocol, testDriveAfter: e.checked})} binary={true} />
                <label htmlFor="testDriveAfter">Client agreed for a test drive after work is done</label>
            </div>
            <div className="field-checkbox">
                <Checkbox id="contactOnEveryChange" checked={vehicleProtocol.contactOnEveryChange} onChange={(e) => setVehicleProtocol({...vehicleProtocol, contactOnEveryChange: e.checked})} binary={true} />
                <label htmlFor="contactOnEveryChange">Client want to be informed about work progress</label>
            </div>
            <div className="field-checkbox">
                <Checkbox id="clientMaxBudget" checked={vehicleProtocol.clientMaxBudget} onChange={(e) => setVehicleProtocol({...vehicleProtocol, clientMaxBudget: e.checked})} binary={true} />
                <label htmlFor="clientMaxBudget">Client specified his maxium budget</label>
            </div>
            { vehicleProtocol.clientMaxBudget && <div className="field">
              <label htmlFor="visualCheckNote" className="mr-0 lg:mr-2">Budget limit [PLN]: </label>
              <InputText  id="clientMaxBudgetNote" type="text" value={vehicleProtocol.clientMaxBudgetNote} onChange={(e) => setVehicleProtocol({...vehicleProtocol, clientMaxBudgetNote: e.target.value})}/>
            </div>}
              
            <MultiSelect value={vehicleProtocol.selectedServiceReasons} onChange={(e) => {setVehicleProtocol({...vehicleProtocol, selectedServiceReasons: e.value}) }}
                        options={serviceReasons} optionLabel="value" placeholder="Service reasons" className="mt-2" scrollHeight="50vh"/>
    
          </div>
          <div className="pl-0 lg:pl-4 pt-3 lg:pt-0">
            <div className="field-checkbox">
                <Checkbox id="newPartsApprove" checked={vehicleProtocol.newPartsApprove} onChange={(e) => setVehicleProtocol({...vehicleProtocol, newPartsApprove: e.checked})} binary={true} />
                <label htmlFor="newPartsApprove">Client agreed for original parts</label>
            </div>
            <div className="field-checkbox">
                <Checkbox id="usedPartsApprove" checked={vehicleProtocol.usedPartsApprove} onChange={(e) => setVehicleProtocol({...vehicleProtocol, usedPartsApprove: e.checked})} binary={true} />
                <label htmlFor="usedPartsApprove">Client agreed for minimaly used parts (if needed)</label>
            </div>
            <div className="field-checkbox">
                <Checkbox id="onlyOriginalParts" checked={vehicleProtocol.onlyOriginalParts} onChange={(e) => setVehicleProtocol({...vehicleProtocol, onlyOriginalParts: e.checked})} binary={true} />
                <label htmlFor="onlyOriginalParts">ONLY original parts</label>
            </div>
            <div className="field-checkbox">
                <Checkbox id="hqReplacementsApprove" checked={vehicleProtocol.hqReplacementsApprove} onChange={(e) => setVehicleProtocol({...vehicleProtocol, hqReplacementsApprove: e.checked})} binary={true} />
                <label htmlFor="hqReplacementsApprove">HIGH quality replacements</label>
            </div>
            <div className="field-checkbox">
                <Checkbox id="lqReplacementsApprove" checked={vehicleProtocol.lqReplacementsApprove} onChange={(e) => setVehicleProtocol({...vehicleProtocol, lqReplacementsApprove: e.checked})} binary={true} />
                <label htmlFor="lqReplacementsApprove">LOW quality replacements</label>
            </div>
            <div className="field">
              <label htmlFor="visualCheckNote" className="mr-0 lg:mr-2">Current mileage [km]: </label>
              <InputText id="currentMileage" type="number" value={vehicleProtocol.currentMileage} onChange={(e) => setVehicleProtocol({...vehicleProtocol, currentMileage: e.target.value})} />
            </div>
            <div className="field-checkbox">
                <Checkbox id="otherInfo" checked={vehicleProtocol.otherInfo} onChange={(e) => setVehicleProtocol({...vehicleProtocol, otherInfo: e.checked})} binary={true} />
                <label htmlFor="otherInfo">Extra information</label>
            </div>
            { vehicleProtocol.otherInfo && <div className="float-label">
              <InputText id="otherInfoTextarea" type="text" value={vehicleProtocol.otherInfoTextarea} onChange={(e) => setVehicleProtocol({...vehicleProtocol, otherInfoTextarea: e.target.value})} placeholder="Description"/>
            </div>}
          </div>
        </div>
      </Fieldset>)
}

