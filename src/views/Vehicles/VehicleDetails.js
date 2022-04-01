import { callTicketsHistory } from '../../components/fetchTicketHistory'
import { DeleteFunc, relocateCarsFunc } from '../../components/EditMoveDeleteOptions'
import copyToClipboard from '../../components/copyToClipboard'
import ContextStore from '../../store/ContextStore'
import TicketsHistory from '../Tasks/TicketsHistory'

import { betterLooking } from '../../components/visualChanges'

import firebase from 'firebase/app'

import { Card } from 'primereact/card'
import { toast } from 'react-toastify'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useContext } from 'react';


function VehicleDetails(){

    const MainPath = firebase.firestore()
                    .collection('warsztat').doc('Pojazdy').collection('VIN')

    const { activeVehicle, getVehicleData } = useContext(ContextStore)
    const navigate = useNavigate()
    const { vin } = useParams()
    const [isLoading, setIsLoading] = useState(true)
    const [currentVehicle, setCurrentVehicle] = useState({})


    useEffect(() => {
        if(!activeVehicle.length){
            fetchCarData()
        } else {
            setCurrentVehicle(activeVehicle)
            setIsLoading(false)
        }
    },[])


    function copyValue(e) {
        const text = e.target.innerText
        copyToClipboard(text)

        toast.info(`Value: "${text}" has been copied to Clipboard`, {autoClose: 3000})
    }

    function openEditVehicleForm() {
      // There is already saved data to context API on load
      navigate(`/vehicles/details/${currentVehicle['VIN']}/edit`)
    }

    async function relocateFunc(carData, VIN) {
        const confirmUnassign = await relocateCarsFunc(carData, VIN)
        if (confirmUnassign !== false) {
            toast.success('Vehicle unassigned from a client.')
            setCurrentVehicle({...currentVehicle, Tel: ''})
            getVehicleData({...currentVehicle, Tel: ''})
        }
    }

    async function fetchCarData(){
        const car = MainPath.doc(vin)
        const getData = await car.get()
        
        if(!getData.data()) {
            toast.warn(`Vehicle with given VIN does not exists: ${vin}`)
            navigate('/vehicles')
        } else {
            setCurrentVehicle(getData.data())
            getVehicleData(getData.data())
            setIsLoading(false)
        }
    }

    const confirmDeleteModal = async (VIN) => {
        const checkForTickets = (await callTicketsHistory(VIN)).some(ticket => ticket[1].length > 0)

        confirmDialog({
          message: `Are you sure you want to delete vehicle ${VIN}?`,
          header: 'Confirmation',
          icon: 'pi pi-exclamation-triangle',
          acceptClassName: 'p-button-success',
          rejectClassName: 'p-button-danger',
          accept: async () => {
            if(checkForTickets === false){
                let confirm = await DeleteFunc('Vehicle', MainPath , VIN)
                if(confirm !== false) navigate('/vehicles')
            } else {
                toast.error("Vehicle has ticket history records!")
            }
          },
          reject: () => {}
        })
    }


    const cardTitle = <>
        <div style={{position: 'absolute', top: '0px', right: '10px', fontSize: '2.2rem', cursor: 'pointer'}} onClick={() => navigate(-1)}>&times;</div>
        <div className="text-center my-2">Vehicle details: 
        { `  ${currentVehicle.Marka} ${currentVehicle.Model} ${currentVehicle.Wersja_Rocznik || ''}` }</div>
    </>

    const cardFooter = <div className="flex flex-column md:flex-row justify-content-center mb-3">
        <Button disabled={isLoading} label="Edit vehicle data" onClick={() => openEditVehicleForm()} icon="pi pi-pencil" />
        <Button disabled={isLoading} label={`Delete vehicle's data: ${currentVehicle?.['VIN'] || "" }`} onClick={() => confirmDeleteModal(currentVehicle.VIN)}
        className="p-button-danger mx-0 md:mx-3 my-3 md:my-0" icon="pi pi-trash" />
        { currentVehicle?.Tel && <Button disabled={isLoading} label="Delete vehicle assigment" className="p-button-warning"
                                        onClick={() => relocateFunc(currentVehicle, currentVehicle['VIN'])} icon="pi pi-user-minus" />
        }
  </div>


    return(<div className="pt-5">
        <Card style={{maxWidth:'1100px'}} className="relative mx-auto" title={cardTitle} footer={cardFooter}>

        { !isLoading && 
        <div className="flex flex-column lg:flex-row justify-content-center" onDoubleClick={(e) => copyValue(e)}>
          <div className="flex flex-column" style={{maxWidth:'290px'}}>
            <div className="flex flex-row mb-1">
              <div className="font-bold mr-2">Client: </div>
              <div className="copy">{ currentVehicle?.['Tel'] || 'CLIENT IS UNASSIGNED'}</div>
            </div>
            <div className="flex flex-row mb-1">
              <div className="font-bold mr-2">Manufacturer: </div>
              <div className="copy">{ currentVehicle?.['Marka'] }</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Model: </div>
              <div className="copy">{ currentVehicle?.['Model'] }</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Production Year / Generation: </div>
              <div className="copy">{ currentVehicle?.['Wersja_Rocznik'] || ''}</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">VIN: </div>
              <div className="copy">{ currentVehicle?.['VIN'] }</div>
            </div>
            { currentVehicle?.['VIN'] && <a className="p-button-text link" target="_blank" rel="noreferrer"
              href={`https://pl.vindecoder.pl/${currentVehicle?.['VIN']}`} style={{width:'250px'}}>Check data in VIN encoder</a> }
            { currentVehicle?.['Numer_rejestracyjny'] && 
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Number Plate: </div>
              <div className="copy">{ currentVehicle?.['Numer_rejestracyjny'] || 'Data not provided'}</div>
            </div>
            }
          </div>
          <div className="ml-0 mt-4 lg:mt-0 lg:ml-4 flex flex-column" style={{maxWidth:'280px'}}>
            <h4 className="justify-content-start">Engine:</h4>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Capacity[cm<sup>3</sup>]: </div>
              <div className="copy">{ currentVehicle?.['Silnik_Pojemnosc'] || 'Data not provided' }</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Power[KM]: </div>
              <div className="copy">{ currentVehicle?.['Silnik_Moc'] || 'Data not provided'}</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Code: </div>
              <div className="copy">{ currentVehicle?.['Silnik_Kod'] || 'Data not provided'}</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Fuel: </div>
              <div className="copy">{ currentVehicle?.['Paliwo']?.name || (currentVehicle?.['Paliwo'] ? betterLooking(currentVehicle['Paliwo']) : 'Data not provided')}</div>
            </div>
          </div>
          <div className=" ml-0 mt-4 lg:mt-0 lg:ml-4 flex flex-column">
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Mileage: </div>
              <div className="copy">{ currentVehicle?.['Przebieg']?.length ? currentVehicle?.['Przebieg'] + ' km' : 'Data not provided'}</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Drive type: </div>
              <div className="copy">{ currentVehicle?.['Naped'] || 'Data not provided'}</div>
            </div>
            <div className="flex flex-row my-1">
              <div className="font-bold mr-2">Transmission: </div>
              <div className="copy">{ currentVehicle?.['SkrzyniaBiegow'] || 'Data not provided'}</div>
            </div>
            { currentVehicle?.['Opis'] && <div className="flex flex-row my-1" style={{maxWidth: '330px'}}>
              <div className="font-bold mr-2">Additional information: </div>
              <div dangerouslySetInnerHTML={{__html: currentVehicle.Opis }} style={{wordWrap: 'break-word', overflow: 'hidden'}}></div>
            </div>}
          </div>

        </div>
        }
        {isLoading && <i className="flex justify-content-center pi pi-spin pi-spinner" /> }
        {!isLoading && <TicketsHistory VIN={currentVehicle?.['VIN']} Tel={currentVehicle?.['Tel']} />}
    </Card>
  </div>)
}

export default VehicleDetails