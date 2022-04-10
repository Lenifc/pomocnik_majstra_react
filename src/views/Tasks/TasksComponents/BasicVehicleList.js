import { toast } from 'react-toastify'

import { useEffect, useState, useRef } from 'react'
import { useContext } from 'react'
import firebase from 'firebase/app'

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { RadioButton } from 'primereact/radiobutton'
import { InputText } from 'primereact/inputtext'
import { Divider } from 'primereact/divider'
import { FilterMatchMode } from 'primereact/api'

export default function BasicVehicleList({closeClientModal, provideVehicleData, provideClientData}) {

    const [recivedClients, setRecivedClients] = useState([])
    const [recivedVehicles, setRecivedVehicles] = useState([])
    const [unassignedVehicles, setUnassignedVehicles] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    // const searchValue = ref()

    const limit = useRef(100)
    const [disableNextButton, setDisableNextButton] = useState(true)
    const [selectedCar,setSelectedCar] = useState('')
    const [filterInput,setFilteredInput] = useState('')

    const [tableFilters, setTableFilters] = useState({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
	const clearTableFilters = () => { setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})}

    const clientPath = firebase.firestore()
      .collection('warsztat').doc('Klienci').collection('Numery').orderBy("Ostatnia_Aktualizacja", "desc") 

    const vehiclePath = firebase.firestore()
      .collection('warsztat').doc('Pojazdy').collection('VIN')

    async function getClientsFromFirebase(req) {
      if(req === 'more') limit.current += 100

      try{
        //  let clientResponse = await clientPath.get({source: 'cache'})
        let clientResponse = await clientPath.get()
        let vehicleResponse = await vehiclePath.get()

        if(clientResponse.length < 0 || vehicleResponse.length < 0){
            throw Error('Cannot load required data!')
        } else {
            if (!clientResponse.docs.length) {
                setDisableNextButton(false)
                toast.info('All vehicles have been downloaded!')
            }

                // Assign cars to their owners by phoneNum
            let vehiclesData = vehicleResponse.docs.map(doc => doc.data())
            let clientsData = clientResponse.docs.map(doc => doc.data()).filter(client => Object.values(vehiclesData).some((car) => car.Tel === client.Tel))

            setRecivedVehicles(vehiclesData)
            // setRecivedClients(clientsData)
            setRecivedClients([...clientsData, {Tel: 'UNASSIGNED'}])
            setUnassignedVehicles(vehiclesData.map(car => car).filter(item => !item.Tel))

            setDisableNextButton(false)
            if (clientResponse.docs.length < limit.current) {
                setDisableNextButton(true)
                toast.info('All vehicles have been downloaded!')
            }
            setIsLoading(false)
        }
      } 
      catch(err){
          toast.error(err.message)
      }
    }

    function onlyCars(clientTel) {
        return recivedVehicles.map(car => car).filter(item => {
            return clientTel === 'UNASSIGNED' ? !item.Tel : item?.Tel === clientTel 
        })
    }

	function showEvent(searchVal) {
		if (searchVal.length > 2) setTableFilters({ 'global': { value: searchVal, matchMode: FilterMatchMode.CONTAINS }})
		else setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
	}

    useEffect(() => {
        getClientsFromFirebase()
    },[])



    const tableHeader =  
    <div className="flex justify-content-between flex-column md:flex-row">
        <Button icon="pi pi-filter-slash" label="Clear" className="p-button-outlined" onClick={() => clearTableFilters()} tooltip='Clear' />
        <span className="input-icon-left">
            <i className="pi pi-search" />
            <InputText placeholder="Filter..." onKeyUp={(e) => showEvent(e.target.value.trim())} tooltip="Type at least 3 characters to search" tooltipOptions={{position: 'left'}}/>
        </span>
    </div>

    const phoneNumBody = ({Tel, Tel2}) => { return (
        <div className="flex flex-column">
            <div>{Tel}</div>
            { Tel2 && <div>{Tel2}</div>}
        </div>
    )}

    const vehiclesBody = (data) => {
        return(<>
        { onlyCars(data.Tel).map(car => {
            return(
            <div id={`id${car.VIN}`} key={car.VIN} className="Cars">
              {car.VIN && <div className="flex flex-row justify-content-between">
                <div className="left flex flex-column 2">
                  <div>{ car.Marka } { car.Model }</div>
                  <div className="text-nowrap text-truncate" style={{maxWidth:'200px'}}>{ car.VIN }</div>
                </div>
                <div className="right flex flex-row align-items-center">
                  <RadioButton name="select" checked={selectedCar === car} value={[car, data]} onChange={() => setSelectedCar(car)} className="mr-2" />
                  { selectedCar === car && <Button className="p-button-success submit"
                            onClick={() => { closeClientModal(false); provideVehicleData(selectedCar); provideClientData(data)}} label="Submit" />}
                </div>
              </div>}
              <Divider />
            </div>
            )
        }
        )
    }</>)
    }


    return(
        <div>
        <h3 className="text-center mb-3">Select a vehicle which you want to create a ticket.</h3>
        { !disableNextButton && <Button onClick={() => getClientsFromFirebase('more')} className="mx-auto p-button-secondary" label="Load more vehicles" /> }
        <DataTable value={recivedClients} dataKey="id" responsiveLayout="stack" stripedRows showGridlines paginator={true} rows={20}
                    className="datatable-sm pt-4 text-center" filters={tableFilters} filterDisplay="menu"
                    loading={isLoading} breakpoint="888px" header={tableHeader}>
         
            <Column style={{width: '45px'}} className="text-center" body={(data) => recivedClients.indexOf(data)+1} />
            <Column field="Imie" header="Client name" className="text-center"/>
            <Column field="Tel2" className="hidden" />
            <Column field="Tel" header="Contact number" className="text-nowrap text-center px-2" body={phoneNumBody}/>
            <Column field="Pojazdy" header="Vehicles"  style={{width:'350px'}} body={(data => vehiclesBody(data))} />
        </DataTable>
      </div>)
}

