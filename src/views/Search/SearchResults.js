import './SearchResults.css'

import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import { confirmDialog } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

import { DeleteFunc } from '../../components/EditMoveDeleteOptions'

import { callTicketsHistory } from '../../components/fetchTicketHistory'
import TicketsHistory from '../Tasks/TicketsHistory'

import ContextStore from '../../store/ContextStore'
import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import firebase from 'firebase/app'


function SearchResults({outputVehicles, outputClient}){

    const navigate = useNavigate()

    const { activeSearchResults, getActiveSearchResults, getClientData, getVehicleData} = useContext(ContextStore)

    const [resultData, setResultData] = useState('')
    const [client, setClient] = useState(activeSearchResults ? activeSearchResults[0] : '')



    const clientPath = firebase.firestore()
                                .collection('warsztat').doc('Klienci').collection('Numery')
    const vehiclePath = firebase.firestore()
                                .collection('warsztat').doc('Pojazdy').collection('VIN')

    function openEditClientForm(client){
        getClientData(client)
        navigate(`/clients/details/${client?.['Tel']}/edit`)
    }

    function openEditVehicleForm(car){
        getVehicleData(car)
        navigate(`/vehicles/details/${car['VIN']}/edit`)
    }

    function openCarDetails(car){
        getVehicleData(car)
        navigate(`/vehicles/details/${car['VIN']}`)
    }

    function openClientDetails(client){
        getClientData(client)
        navigate(`/clients/details/${client?.['Tel']}`)
    }

    const confirmDeleteModal = async (operation, target) => {
      const checkForTickets = (await callTicketsHistory(target || 0)).some(ticket => ticket[1].length > 0)

    confirmDialog({
        message: operation === 'removeClient' ?
          `Are you sure you want to delete client: ${target}?` : 
          (operation === 'removeCar' ? 
            `Are you sure you want to delete vehicle: ${target}?` : 'Invalid data type!'),
        header: operation === 'removeClient' ?
          `Delete client` : (operation === 'removeCar' ? `Delete vehicle` : 'Invalid data type!'),
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-success',
        rejectClassName: 'p-button-danger',
        acceptLabel: 'Tak',
        rejectLabel: 'Nie',
        accept: async () => {
            if (operation === 'removeClient') {
                const confirmDelete = await DeleteFunc('Client', clientPath, target)
                if (confirmDelete !== false) setResultData(['', resultData[1]])
            }
            if (operation === 'removeCar') {
                if(checkForTickets === false){
                    const confirmDelete = await DeleteFunc('Vehicle', vehiclePath, target)
                    if (confirmDelete !== false) {
                        let filteredVehicle = resultData[1].filter(car => car.VIN !== target)
                        setResultData([resultData[0], filteredVehicle])
                    } 
                    else toast.info('Cannot fully delete vehicle, because it contains service history')
                } 
                else toast.warn('Cannot fully delete vehicle, because it contains service history')
            }
        },
        reject: () => {}
      });
    }


    useEffect(() => {
      if(!outputClient && !outputVehicles){
        setResultData(activeSearchResults)
      } else setResultData([outputClient, outputVehicles])
        setClient(outputClient || activeSearchResults)
    }, [])

    // workaround for client that is not loading properly when searching by VIN
    useEffect(() =>{
        if(!outputClient && !outputVehicles){
            setResultData(activeSearchResults)
        } 
        else setResultData([outputClient, outputVehicles])
            setClient(outputClient || activeSearchResults)
    }, [outputClient])

    useEffect(() => {
        setClient(resultData[0])
    },[resultData])

    const cardHeader = <>
        { !client && <h3 className="text-center pt-4" >Vehicle does not have assigned client</h3> } 
        { client && <div>
            <div className="text-center pt-3">
              <h3>Client:</h3>
            </div>
            <div className="toolbarClient">
              <Button className="p-button-danger mr-2 p-button-rounded" icon="pi pi-trash" tooltip="Delete client" onClick={() => confirmDeleteModal('removeClient', client.Tel)} />
              <Button className="p-button-primary p-button-rounded" icon="pi pi-pencil" tooltip="Edit client" onClick={() => openEditClientForm(client)} />
            </div>
        </div>}
    </>


    return(
        <div className="flex flex-column justify-content-center align-items-center">
            { resultData && resultData.length > 0 && <>
            <div className="flex flex-row justify-content-center pt-4">
                <Button icon="pi pi-ban" className="p-button-secondary" label="Clear results" onClick={() => {
                        getActiveSearchResults('')
                        setResultData('')
                        document.querySelectorAll('.searchBtn').forEach(btn => btn.classList.remove('active'))
                }} />
            </div>
            <h3 className="pt-6 text-center"> Results:</h3>
            <div className="pb-4 pt-3" style={{width:'100%', maxWidth:'1000px'}}>
                <Card className="relative" header={cardHeader}>
                    <div className="client">
                        <div className="my-1">
                            { client?.Imie && <span className="font-bold">Name:</span>} {client?.['Imie']}
                        </div>
                        <div className="my-1">
                            { client?.Tel && <span className="font-bold">Contact number: </span>} 
                            <span className="font-bold mouse-pointer link" onClick={() => openClientDetails(client)}>{client?.['Tel']}</span>
                        </div>
                        { client?.Tel2 && <div className="my-1">
                            <span className="font-bold">2nd contact number:</span> { client?.['Tel2']}
                        </div>}
                        { client?.kodPocztowy && client?.Miejscowosc && client?.Ulica && <div>
                            <div className="my-1"><span className="font-bold">{ client?.['kodPocztowy'] }</span> { client?.['Miejscowosc'] }</div>
                            <div className="my-1"><span className="font-bold"></span> { client?.['Ulica']} Street</div>
                        </div>}
                        { client?.Opis && <div className="my-1">
                            <span className="font-bold">Description:</span> <span dangerouslySetInnerHTML={{__html: client?.['Opis']}}></span>
                        </div>}
                </div>
                    <Divider />
                <div className="vehicles">
        
                    { resultData?.[1] && <h3 className="text-center">Client's vehicles:</h3>}
                    { !resultData?.[1] && <h3>Client does not have any assigned vehicles</h3>}
                    {resultData?.[1] && resultData?.[1].map(vehicle => {
                    return ( <div className="vehicle relative" key={vehicle.VIN}>
                        <div className="toolbarVehicle">
                            <Button className="p-button-danger mr-2 p-button-rounded" icon="pi pi-trash" tooltip="Delete vehicle" onClick={() => confirmDeleteModal('removeCar', vehicle.VIN)} />
                            <Button className="p-button-primary p-button-rounded" icon="pi pi-pencil" tooltip="Edit vehicle data" onClick={() => openEditVehicleForm(vehicle)} />
                        </div>
                        <div className="my-1 font-bold">{ `${vehicle['Marka']} ${vehicle['Model']} ${vehicle['Wersja_Rocznik'] || ''}`}</div>
                        <div className="my-1">
                            <span className="font-bold">VIN: </span> 
                            <span className="font-bold mouse-pointer link" onClick={() => openCarDetails(vehicle)}>{vehicle['VIN']}</span> 
                        </div>
                        { vehicle['Numer_rejestracyjny'] && <div className="my-1"><span className="font-bold">Licence plate:</span> {vehicle['Numer_rejestracyjny']}</div>}
                        <div className="my-1"><span className="font-bold">Fuel type:</span> {vehicle['Paliwo'].name || vehicle['Paliwo']}</div>
                        { vehicle['Przebieg'] && <div className="my-1"><span className="font-bold">Mileage:</span> {vehicle['Przebieg']} km</div>}
                        { vehicle['Silnik_Pojemnosc'] && <div className="my-1"><span className="font-bold">Engine capacity:</span> {vehicle['Silnik_Pojemnosc']} cm<sup>3</sup></div>}
                        { vehicle['Silnik_Moc'] && <div className="my-1"><span className="font-bold">Power/Torque:</span> {vehicle['Silnik_Moc']} KM</div>}
                        { vehicle['Silnik_Kod'] && <div className="my-1"><span className="font-bold">Engine code:</span> {vehicle['Silnik_Kod']}</div>}
                        { vehicle['Naped'] && <div className="my-1"><span className="font-bold">Drivetrain type:</span> {vehicle['Naped']}</div>}
                        { vehicle['SkrzyniaBiegow'] && <div className="my-1"><span className="font-bold">Transmission:</span> {vehicle['SkrzyniaBiegow']}</div>}
                        <TicketsHistory VIN={vehicle?.['VIN']} Tel={client?.['Tel']} />
                        <Divider />
                    </div>)
                    })}
                </div>
            </Card>
            </div>
            </>}
            </div>
    )
}

export default SearchResults