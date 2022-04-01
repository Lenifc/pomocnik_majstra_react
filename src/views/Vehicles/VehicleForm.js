

import {Dropdown} from 'primereact/dropdown'
import {Editor} from 'primereact/editor'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { toast } from 'react-toastify'

import { useEffect, useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import ContextStore from '../../store/ContextStore'

import { getTime } from '../../components/getCurrentTime'
import validPhoneNum from '../../components/validPhoneNum.js'
import validateVIN from '../../components/validateVIN.js'
import { updateVehicleVIN } from '../../components/EditMoveDeleteOptions.js'
import { betterLooking, replaceSpaces, onlyNumbers } from '../../components/visualChanges'

import firebase from 'firebase/app'


function VehicleForm(){

  const { pathname } = useLocation()
  const navigate = useNavigate()

  const { activeVehicle, activePhoneNumber, getActivePhoneNumber, getVehicleData } = useContext(ContextStore)

  const [phoneNumNotStored, setPhoneNumNotStored] = useState(true)
  const [phoneNum, setPhoneNum] = useState(activePhoneNumber || '')
  
  const [contextDataLoaded, setContextDataLoaded] = useState(false)
  
  const [manualBrandModelVersionInput, setManualBrandModelVersionInput] = useState(false)
  const [manualModelVersionInput, setManualModelVersionInput] = useState(false)
  const [manualVersionInput, setManualVersionInput] = useState(false)
  
  const [brands, setBrands] = useState()
  const [models, setModels] = useState()
  const [versions, setVersions] = useState()
  const [capacities, setCapacities] = useState()
  const [brandsFetchInProgress, setBrandsFetchInProgress] = useState(false)
  const [modelsFetchInProgress, setModelsFetchInProgress] = useState(false)
  const [versionsFetchInProgress, setVersionsFetchInProgress] = useState(false)

  let controller = new AbortController()


  const vehicles = firebase.firestore()
      .collection('warsztat')
      .doc('Pojazdy').collection("VIN")

  const clients = firebase.firestore()
      .collection('warsztat')
      .doc('Klienci').collection('Numery')

  const counterPath = firebase.firestore()
      .collection('warsztat')
      .doc('Pojazdy')
      
  const link = 'https://europe-west1-baza-mech.cloudfunctions.net/fetchData' // PRODUCTION

  const fuelOptions = [
      {name: 'Petrol', value: 'petrol'},
      {name: 'Petrol-LPG', value: 'petrol-lpg'},
      {name: 'Diesel', value: 'diesel'},
      {name: 'Electric', value: 'electric'},
      {name: 'Hybrid', value: 'hybrid'}
  ]

  const gearboxOptions = [
      {name: 'Automatic', value: 'Automatyczna'},
      {name: 'Manual', value: 'Manualna'}, 
      {name: 'None (Electric)', value: 'Brak (Elektryk)'}
  ]

  const drivetrainOptions = [
      {name: 'FWD', value: 'Przód'},
      {name: 'RWD', value: 'Tył'},
      {name: '4x4', value: '4x4'}
  ]

  const clearCarSpec = useState({
    selectedBrand: '',
    selectedModel: '',
    selectedVersion: '',
    selectedFuel: '',
    engineCapacity: '',
    enginePower: '',
    engineCode: '',
    selectedTransmission: '',
    selectedDriveTrain: '',
    numberPlates: '',
    VIN: '',
    mileage: '',
    description: '',
  })

  // ALT
  // const [carSpec, setCarSpec] = useState(clearCarSpec[0])

  //
  // TRY TO FIX FUNCTION 'autoFillData' ONMOUNT
  //
  const [carSpec, setCarSpec] = useState(activeVehicle ? {
    phoneNum: activeVehicle['Tel'] || activePhoneNumber || '',
    selectedBrand: activeVehicle?.['Marka']?.toLowerCase() || '', // chwilowy workaround dopoki nie dodam danych do firebase
    selectedModel: activeVehicle?.['Model']?.toLowerCase() || '', // chwilowy workaround dopoki nie dodam danych do firebase
    selectedVersion: activeVehicle['Wersja_Rocznik'] || '',
    selectedFuel: activeVehicle['Paliwo']?.value || activeVehicle['Paliwo'] || '', // depends on the implementation versions 1st - I was sending object to Firestore, 2nd - only value

    engineCapacity: activeVehicle['Silnik_Pojemnosc'] || '',
    enginePower: activeVehicle['Silnik_Moc'] || '',
    engineCode: activeVehicle['Silnik_Kod'] || '',
    selectedTransmission: activeVehicle['SkrzyniaBiegow'] || '',
    selectedDriveTrain: activeVehicle['Naped'] || '',
    numberPlates: activeVehicle['Numer_rejestracyjny'] || '',
    VIN: activeVehicle['VIN'] || '',
    mileage: activeVehicle['Przebieg'] || '',

    description: activeVehicle['Opis'] || ''
  } : clearCarSpec[0])
    //
    // FIX
    //
    
    // function autoFillData() {
    //   setPhoneNum(activeVehicle['Tel'] || activePhoneNumber || '')
    //   setCarSpec({
    //   ...carSpec,
    //   phoneNum: activeVehicle['Tel'] || activePhoneNumber || '',
    //   selectedBrand: activeVehicle['Marka'].toLowerCase() || '',
    //   selectedModel: activeVehicle['Model'].toLowerCase() || '',
    //   selectedVersion: activeVehicle['Wersja_Rocznik'] || '',
    //   selectedFuel: activeVehicle['Paliwo']?.value || '',
  
    //   engineCapacity: activeVehicle['Silnik_Pojemnosc'] || '',
    //   enginePower: activeVehicle['Silnik_Moc'] || '',
    //   engineCode: activeVehicle['Silnik_Kod'] || '',
    //   selectedTransmission: activeVehicle['SkrzyniaBiegow'] || '',
    //   selectedDriveTrain: activeVehicle['Naped'] || '',
    //   numberPlates: activeVehicle['Numer_rejestracyjny'] || '',
    //   VIN: activeVehicle['VIN'] || '',
    //   mileage: activeVehicle['Przebieg'] || '',
  
    //   description: activeVehicle['Opis'] || ''
    //   })
    // }

    function cleanVehicleFormFunc() {
      setCarSpec(clearCarSpec[0])
      setModels('')
      setVersions('')
      setPhoneNum('')
      setManualBrandModelVersionInput(false)
      setManualModelVersionInput(false)
      setManualVersionInput(false)
    }

      // FETCH FUNCTIONS AND ITS TRIGGERS
    useEffect(() => {
      if(!manualBrandModelVersionInput){
        if(pathname.indexOf('edit') <= 0) {
          setCarSpec(clearCarSpec[0])
          fetchBrands()
        }
        else if(Object.keys(activeVehicle).length && pathname.indexOf('edit') > 0){
          // autoFillData()
          if(carSpec?.selectedBrand.length) setContextDataLoaded(true)
          setPhoneNum(activeVehicle['Tel'] || activePhoneNumber || '')
          fetchBrands()
          if(!phoneNum || phoneNum === "") setPhoneNumNotStored(true)
          if(!activeVehicle || (activeVehicle && contextDataLoaded)) setCarSpec({...carSpec, selectedModel: '', selectedVersion: ''})
        } 
        else navigate(-1)
      }
    }, [])

    async function fetchBrands() {
      setBrandsFetchInProgress(true)
      setManualBrandModelVersionInput(false)
      setManualModelVersionInput(false)
      setManualVersionInput(false)

      try {
        let data = await( await fetch(`${link}/dodaj`, {
            signal: controller.signal
          })).json()
        
        let allBrands = data?.options
        if (allBrands) setBrands(Object.entries(allBrands)
                                        .sort((next, current) => next[0] > current[0] ? 1 : -1)
                                        // re-model object structure to just display name and it's value
                                        .map(item => ({name: item[1].en || item[1].pl, value: item[0]}))
        )
        setBrandsFetchInProgress(false)
      }       
      catch(err){
        setBrandsFetchInProgress(false)
        setManualBrandModelVersionInput(true)
        toast.warn(`${err.message}.`)
      }
    }

      // on every brand/manufacturer change trigger below functions
    useEffect (() => {
        setModels('')
        setVersions('')
        if(carSpec.selectedBrand === 'other') setManualBrandModelVersionInput(true)
        else if(!manualBrandModelVersionInput){
          setManualModelVersionInput(false)
          setManualVersionInput(false)
          if(carSpec.selectedBrand?.length) fetchModels()
        }
        if(!activeVehicle || (activeVehicle && contextDataLoaded)) setCarSpec({...carSpec, selectedModel: '', selectedVersion: ''})
    },[carSpec.selectedBrand])

    async function fetchModels() {
      setModelsFetchInProgress(true)
      try{
        if(carSpec.selectedBrand){
          const data = await( await fetch(`${link}/dodaj/${carSpec.selectedBrand}`)).json()
          let allModels = data?.options
          if(allModels) setModels(Object.entries(allModels)
                                        .sort((next, current) => next[0] > current[0] ? 1 : -1)
                                        // re-model object structure to just display name and it's value
                                        .map(item => ({name: item[1].en || item[1].pl, value: item[0]}))
          )
        } else setCarSpec({...carSpec, selectedBrand: '', selectedModel: '', selectedVersion: ''})
        setModelsFetchInProgress(false)
      }
      catch {
        setModels('')
        setManualModelVersionInput(true)
        setModelsFetchInProgress(false)
        toast.warn(`Empty model list of ${carSpec.selectedBrand}. Please fill the input manually.`)
      }
    }

      // on every model change trigger below functions
    useEffect(() => {
        setVersions('')
        if(carSpec.selectedModel === 'other') setManualModelVersionInput(true)
        else if(!manualModelVersionInput){
          setManualVersionInput(false)
          if(carSpec.selectedBrand && carSpec.selectedModel) fetchVersion()
          else setCarSpec({...carSpec, selectedModel: '', selectedVersion: ''})
        }
        if(!activeVehicle || (activeVehicle && contextDataLoaded)) setCarSpec({...carSpec, selectedVersion: ''})
    },[carSpec.selectedModel])
    
    async function fetchVersion() {
      setVersionsFetchInProgress(true)
      try{
        const data = await( await fetch(`${link}/dodaj/${carSpec.selectedBrand}/${replaceSpaces(carSpec.selectedModel)}`)).json()
        let allVersions = data?.options
            if(allVersions) setVersions(Object.entries(allVersions)
                                              .sort((next, current) => next[0] > current[0] ? 1 : -1)
                                              // re-model object structure to just display name and it's value
                                              .map(item => ({name: item[1].en || item[1].pl, value: item[0]}))
            )
        setVersionsFetchInProgress(false)
      }
      catch{
        setManualVersionInput(true)
        setVersionsFetchInProgress(false)
        toast.warn(`Empty generation list of ${carSpec.selectedModel} model. Please fill the input manually.`)
      }
    }

      // check for conditions to fetch engine capacities for provided vehicle or show manual input
    useEffect(() => {
        if(carSpec.selectedBrand && carSpec.selectedModel && 
        !manualBrandModelVersionInput && !manualModelVersionInput) fetchEngineCapacities()
        else if(!carSpec.selectedBrand || !carSpec.selectedModel) setCarSpec({...carSpec, selectedVersion: '', engineCapacity: ''})
        else setCarSpec({...carSpec, engineCapacity: ''})
    },[carSpec.selectedFuel, carSpec.selectedModel])

    async function fetchEngineCapacities() {
      if(!activeVehicle || (activeVehicle && contextDataLoaded)) setCarSpec({...carSpec, engineCapacity: ''})
      try {
        if(carSpec.selectedModel !== null && carSpec.selectedBrand !== null){
          const data = await (await fetch(`${link}/pojemnoscSilnika/${carSpec.selectedBrand}/${replaceSpaces(carSpec.selectedModel)}${carSpec.selectedFuel ? '?fuel_type='+carSpec.selectedFuel : ''}`)).json()
          if(data?.options) setCapacities(Object.entries(data?.options).map(item => ({name: item[1].en || item[1].pl, value: item[0]})))
        }
      } catch{
        setCapacities('')
        toast.warn(`Cannot find available engine capacities for ${carSpec.selectedBrand} ${carSpec.selectedModel} - ${carSpec.selectedFuel ? carSpec.selectedFuel : ''}.`)
      }
    }
  // END OF FETCH FUNCTIONS 
  //


    async function validateData() {
      document.querySelectorAll('.p-invalid').forEach(input => input.classList.remove('p-invalid'))

      if(phoneNum && !validPhoneNum(phoneNum)) document.querySelector('#phoneNum').classList.add('p-invalid')
      if(!carSpec.VIN || !validateVIN(carSpec.VIN)) document.querySelector('#VIN').classList.add('p-invalid')
      if(!carSpec.selectedBrand) document.querySelector('#brand').classList.add('p-invalid')
      if(!carSpec.selectedModel) document.querySelector('#model').classList.add('p-invalid')
      if(!carSpec.selectedFuel) document.querySelector('#fuel').classList.add('p-invalid')
      

      let checkForInvalids = document.querySelectorAll('.p-invalid')

      let formattedMileage = carSpec.mileage ? carSpec.mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : ''

      if (checkForInvalids.length === 0) {

        let currentTime = getTime()
        let ID = Date.now()
        let validVIN = validateVIN(carSpec.VIN)
 
          // convert to polish naming used in Firestore
        let preparedData = {
          id: activeVehicle?.length ? activeVehicle.id : ID,

          Tel: (phoneNum?.trim() && validPhoneNum(phoneNum)) ? validPhoneNum(phoneNum) : '',
          Marka: betterLooking(carSpec.selectedBrand),
          Model: betterLooking(carSpec.selectedModel),
          Wersja_Rocznik: carSpec?.selectedVersion?.trim() || '',
          Paliwo: carSpec?.selectedFuel,

          Silnik_Pojemnosc: carSpec.engineCapacity ? onlyNumbers(carSpec.engineCapacity) : '',
          Silnik_Moc: carSpec.enginePower ? onlyNumbers(carSpec.enginePower) : '',
          Silnik_Kod: carSpec.engineCode?.trim() || '',
          SkrzyniaBiegow: carSpec.selectedTransmission || '',
          Naped: carSpec.selectedDriveTrain || '',
          Numer_rejestracyjny: carSpec.numberPlates?.toUpperCase()?.trim() || '',
          VIN: validVIN,
          Przebieg: formattedMileage || "",

          Opis: carSpec.description || "",
          Ostatnia_Aktualizacja: currentTime,
        }
        if(pathname.indexOf('edit') > 0 && activeVehicle && (validateVIN(activeVehicle.VIN) !== validateVIN(carSpec.VIN))) {
            let confirmUpdate = await updateVehicleVIN(activeVehicle, preparedData)
            if(confirmUpdate !== false) {
              toast.success(`Vehicle's VIN updated: \n${preparedData.VIN}`)
              navigate(-1)
            } else toast.error(`Failed to update vehicle's data`)
        } 
        else sendVehicleToFirebase(preparedData)

      } 
      else toast.warn('Check for invalid/empty inputs!')
    }

      async function checkIfNumberExists(tel){
        let check = await clients.doc(tel).get()
        if(check.exists) {
          toast.success(`Vehicle assigned to client: ${tel}`)
          return 'OK'
        }
        else {
          toast.warn(`To assign this vehicle to client: ${tel} you have to create client's data first.`)
          document.querySelector('#phoneNum').classList.add('p-invalid')
        }
      }

     async function sendVehicleToFirebase(preparedData) {
      let VIN = preparedData.VIN

      if(preparedData.Tel) {
        if(await checkIfNumberExists(preparedData.Tel) !== 'OK') return
      }

      const docReference = vehicles.doc(VIN)

      try{
      let doc = docReference.get()
        if (!doc.exists) {
            await docReference.set({...preparedData, Ostatnia_Aktualizacja: getTime()})
            toast.dismiss()
            toast.success(`New vehicle has been added: ${VIN}`)
          } else {
            if (pathname.indexOf('edit') <= 0) throw Error(`Vehicle with provided VIN: ${VIN} already exists in database!`)
            else {
              await docReference.update({...preparedData, Ostatnia_Aktualizacja: getTime()})
              toast.dismiss()
              toast.success(`Successfully updated vehicle's data: ${VIN}`)
            }
          }
          if(pathname.indexOf('edit') < 0) counterPath.update("Pojazdy", firebase.firestore.FieldValue.increment(1))
          cleanVehicleFormFunc()
          navigate(-1)
        } catch(error){
          toast.error(error.message)
        }
    }


      // cleanup on unmount
    useEffect(() => {
      return () => {
        controller.abort()
        getVehicleData('')
        getActivePhoneNumber('')
      }
    },[]) 


    const cardTitle = <>
      <div style={{position: 'absolute', top: '0px', right: '10px', fontSize: '2.2rem', cursor: 'pointer'}} onClick={() => navigate(-1)}>&times;</div>
      <div className="text-center">{ pathname.indexOf('edit') > 0 ? `Editing vehicle: ${activeVehicle?.Marka} ${activeVehicle.Model} ${activeVehicle.VIN}` : 'Add new vehicle' }</div>
    </>

    const cardFooter = 
    <div className="flex flex-column sm:flex-row justify-content-center">
      <Button className="p-button-success m-2" onClick={() => validateData()}
              label={pathname.indexOf('edit') > 0 ? `Update vehicle's data` : `Add new vehicle`} icon="pi pi-plus"/>
      <Button className="p-button-danger m-2" onClick={() => cleanVehicleFormFunc()} label="Clear form" icon="pi pi-trash"/>
    </div>

    const editorTemplate = 
    <span className="ql-formats">
      <button className="ql-bold"></button>
      <button className="ql-italic"></button>
      <button className="ql-underline"></button>
      <button className="ql-list" value="bullet"></button>
      <button className="ql-link"></button>
    </span>



    return(
    <div className="pt-4">
      <Card className="relative" style={{maxWidth:'1000px', margin:'0 auto'}} title={cardTitle} footer={cardFooter}>
        <form>

        <div className="flex md:flex-row flex-column md:justify-content-evenly align-items-center">
          <div className="required flex flex-column">
            { (phoneNumNotStored || pathname.indexOf('edit') > 0) && <span className="p-float-label mt-3">
              { (phoneNumNotStored || pathname.indexOf('edit') > 0) && 
              <InputText id="phoneNum" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} tooltip="Assign vehicle to client with specified phone number!" />}
              <label htmlFor="phoneNum">Client's Phone Number</label>
            </span> }

            <h3 className="mt-4">Required: </h3>

              {/* Vehicle Brand/Manufacturer Form */}
            <div className='flex flex-row align-items-center'>
              {brandsFetchInProgress && <i className='pi pi-spin pi-spinner' />}
              { !manualBrandModelVersionInput && 
              <Dropdown options={brands} optionLabel="name" className="mt-3" optionValue='value' placeholder="Select Brand" filter={true} 
                  showClear={carSpec.selectedBrand ? true : false} onChange={(e) => setCarSpec({...carSpec, selectedBrand: e.value})} 
                  itemTemplate={(option) => <div><span>{option.name}</span></div>} scrollHeight="60vh" id="brand" value={carSpec.selectedBrand} />
              }
              { manualBrandModelVersionInput && <span className="p-float-label mt-4">
                <InputText id="brand" value={carSpec.selectedBrand} onChange={(e) => setCarSpec({...carSpec, selectedBrand: e.target.value})}/>
                <label htmlFor="brand">Type manufacturer manually</label>
              </span> }
            </div>

              {/* Vehicle Model Form */}
            <div className='flex flex-row align-items-center'>
            {modelsFetchInProgress && <i className='pi pi-spin pi-spinner' />}
              { !manualBrandModelVersionInput && !manualModelVersionInput && 
              <Dropdown options={models} optionLabel="name" className="mt-3" optionValue='value' placeholder="Select Model" filter={true} 
                  showClear={carSpec.selectedModel ? true : false} onChange={(e) => setCarSpec({...carSpec, selectedModel: e.value})} id="model"
                  disabled={!models} scrollHeight="60vh" itemTemplate={(option) => <div><span>{option.name}</span></div>} required value={carSpec.selectedModel} />
              }
              {(manualBrandModelVersionInput || manualModelVersionInput) && <span className="p-float-label mt-4">
                <InputText id="model" value={carSpec.selectedModel} onChange={(e) => setCarSpec({...carSpec, selectedModel: e.target.value})} required />
                <label htmlFor="model">Type model manually</label>
              </span>}
            </div>

              {/* Vehicle versions Form */}
            <div className='flex flex-row align-items-center'>
            {versionsFetchInProgress && <i className='pi pi-spin pi-spinner' />}
              { (!manualVersionInput && !manualBrandModelVersionInput && !manualModelVersionInput) && 
              <Dropdown options={versions} optionLabel="name" optionValue='value' placeholder="Select Version" id="prod_year" value={carSpec.selectedVersion}
                  className="mt-3" onChange={(e) =>  setCarSpec({...carSpec, selectedVersion: e.value})} disabled={!versions} required 
                  scrollHeight="60vh" showClear={carSpec.selectedVersion ? true : false} itemTemplate={(option) => <div><span>{option.name}</span></div>}/>
              }
              { ((carSpec.selectedModel && manualVersionInput) || manualBrandModelVersionInput || manualModelVersionInput) && <span className="p-float-label mt-4">
                <InputText id="prod_year" value={carSpec.selectedVersion} onChange={(e) => setCarSpec({...carSpec, selectedVersion: e.target.value})} required/>
                <label htmlFor="prod_year">Generation:</label>
              </span>}
            </div>

              {/* Vehicle Fuel type */}
            <Dropdown id="fuel" value={carSpec.selectedFuel} options={fuelOptions} optionLabel="name" className="mt-3" required scrollHeight="60vh"
                placeholder="Select fuel type" showClear={carSpec.selectedFuel ? true : false} onChange={(e) => setCarSpec({...carSpec, selectedFuel: e.value})} />

              {/* VIN input with validation */}
            <span className="p-float-label mt-4">
              <InputText id="VIN" maxLength="17" value={carSpec.VIN} required onChange={(e) => setCarSpec({...carSpec, VIN: e.target.value})} tooltip="17-digits vehicle identifier" />
              <label htmlFor="VIN">VIN:</label>
            </span>
            { carSpec.VIN && carSpec.VIN.length > 16 && validateVIN(carSpec.VIN) && <a className="p-button-text link" target="_blank" rel="noreferrer"
                href={`https://pl.vindecoder.pl/${carSpec.VIN}`} style={{width:'250px'}}>Check extra data in external VIN encoder </a>
            }

          </div>
          <div className="extraInformation flex flex-column">
            <h3 className="mb-3 mt-6 md:mt-0">Additional informations: </h3>
            <h4>Engine specification:</h4>
            <div className="flex flex-column sm:flex-row mt-3">
                {/* Engine Capacity Dropdown triggered when Brand and Model is filled, refreshed on every change, also with Fuel  */}
              {( carSpec.selectedBrand && carSpec.selectedModel && (capacities && capacities.length > 0)) &&
              <Dropdown value={carSpec.engineCapacity} options={capacities} optionLabel="name" disabled={!capacities}
                  placeholder="Engine capacity" id="engineCapacity" onChange={(e) => setCarSpec({...carSpec, engineCapacity: e.value})}
                  required scrollHeight="60vh" showClear={carSpec.engineCapacity ? true : false} />
              }

              { (!capacities?.length || !carSpec.selectedModel) && 
                <span className="p-float-label" >
                  <InputText id="engineCapacity" value={carSpec.engineCapacity} onChange={(e) => setCarSpec({...carSpec, engineCapacity: e.target.value})} style={{width:'140px'}} />
                  <label htmlFor="engineCapacity">Capacity[cm<sup>3</sup>]:</label>
                </span>
              }
              <span className="p-float-label my-4 sm:my-0 sm:mx-1">
                <InputText id="enginePower" value={carSpec.enginePower} onChange={(e) => setCarSpec({...carSpec, enginePower: e.target.value})} style={{width:'100px'}} />
                <label htmlFor="enginePower">Power[HP]:</label>
              </span>
              <span className="p-float-label">
                <InputText id="engineCode" value={carSpec.engineCode} onChange={(e) => setCarSpec({...carSpec, engineCode: e.target.value})} style={{width:'110px'}} />
                <label htmlFor="engineCode">Engine code:</label>
              </span>
            </div>

            <label htmlFor="transmission" className="mt-2 mb-1">Transmission:</label>
            <Dropdown id="transmission" value={carSpec.selectedTransmission} options={gearboxOptions}
              optionLabel="name" required placeholder="Select transmission type" showClear={carSpec.selectedTransmission ? true : false}
              scrollHeight="60vh" onChange={(e) => setCarSpec({...carSpec, selectedTransmission: e.value})}/>

            <label htmlFor="drivetrain" className="mt-2 mb-1">Drive type:</label>
            <Dropdown id="drivetrain" value={carSpec.selectedDriveTrain} options={drivetrainOptions}
              optionLabel="name" required placeholder="Select drive type" showClear={carSpec.selectedDriveTrain ? true : false}
              scrollHeight="60vh" onChange={(e) => setCarSpec({...carSpec, selectedDriveTrain: e.value})}/>

            <span className="p-float-label mt-4">
              <InputText id="numberPlates" maxLength="9" value={carSpec.numberPlates} onChange={(e) => setCarSpec({...carSpec, numberPlates: e.target.value})} />
              <label htmlFor="numberPlates">Number plate:</label>
            </span>
            <span className="p-float-label mt-4">
              <InputText id="mileage" maxLength="6" value={carSpec.mileage} onChange={(e) => setCarSpec({...carSpec, mileage: e.target.value})} />
              <label htmlFor="mileage">Mileage:[km]</label>
            </span>
          </div>
        </div>
        <label htmlFor="Textarea">
          <h3 className="mt-3 mb-1 text-center">Description:</h3>
        </label>
        <Editor id="Textarea" value={carSpec.description} headerTemplate={editorTemplate} onChange={(e) => setCarSpec({...carSpec, mileage: e.htmlValue})} 
                className="mx-auto mt-4 mb-6" style={{height: '200px'}}>
        </Editor>

      </form>
  </Card>
</div>)
}

export default VehicleForm