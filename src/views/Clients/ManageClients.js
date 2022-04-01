import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext'
import { FilterMatchMode } from 'primereact/api';
import { Divider } from 'primereact/divider';
import { confirmDialog } from 'primereact/confirmdialog'

import { toast } from 'react-toastify';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

import ContextStore from '../../store/ContextStore'

import firebase from 'firebase/app'


import { DeleteFunc, relocateCarsFunc } from '../../components/EditMoveDeleteOptions'
import copyToClipboard from '../../components/copyToClipboard.js'

import './ManageClients.css'

function ManageClients(){

    const navigate = useNavigate()
    const { getClientData, getVehicleData, getActivePhoneNumber } = useContext(ContextStore)

    const [isLoading, setIsLoading] = useState(true)
    const [recivedClients, setRecivedClients] = useState([])
    const [recivedVehicles, setRecivedVehicles] = useState([])
    const [totalNumberOfClients, setTotalNumberOfClients] = useState(0)
    const [downloadLimit, setDownloadLimit] = useState(50)
    const [disableNextButton, setDisableNextButton] = useState(false)

    const [tableFilters, setTableFilters] = useState({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
    const clearTableFilters = () => { setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})}


    const MainPath = firebase.firestore()
                    .collection('warsztat').doc('Klienci').collection('Numery')

    const vehiclePath = firebase.firestore()
                        .collection('warsztat').doc('Pojazdy').collection('VIN')

    const totalClientsPath = firebase.firestore()
                            .collection('warsztat').doc('Klienci')


		useEffect(() => {
			getClientsFromFirebase()
		}, [])


     async function getClientsFromFirebase(req) {
			 let limit = 50
       if (req === 'more') {
				 setDownloadLimit(downloadLimit+50)
				 limit += 50
			 }

       let clientPath = MainPath
         .orderBy("Ostatnia_Aktualizacja", "desc")
         .limit(req === 'more' ? downloadLimit+50 : downloadLimit )

       if (req === 'all') {
         clientPath = MainPath.orderBy("Ostatnia_Aktualizacja", "desc")
         setIsLoading(true)
       }

       let clientResponse = await clientPath.get()
       let vehicleResponse = await vehiclePath.get()

       let getAllClients = (await totalClientsPath.get()).data().Klienci
       setTotalNumberOfClients(getAllClients)

       setRecivedClients(clientResponse.docs.map(doc => doc.data()))
       setRecivedVehicles(vehicleResponse.docs.map(doc => doc.data()))

       setIsLoading(false)
       setDisableNextButton(false)

       if (!clientResponse.docs.length || req === 'all' || clientResponse.docs.length < limit) {
         setDisableNextButton(true)
         toast.info('All clients have been downloaded!', {autoClose: 3000})
       }
     }


    const confirmDeleteModal = async ({Tel}) => {
          confirmDialog({
            message: `Are you sure you want to delete client ${Tel}?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-success',
            rejectClassName: 'p-button-danger',
            accept: () => {
              let confirm = DeleteFunc('Client', MainPath , Tel)
              if(confirm !== false) setRecivedClients(recivedClients.filter(client => client.Tel !== Tel)) 
            },
            reject: () => {}
          })
      }

      function showEvent(searchVal) {
        if (searchVal.length > 2) setTableFilters({ 'global': { value: searchVal, matchMode: FilterMatchMode.CONTAINS }})
        else setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
      }

      function copyValue(e) {
        const text = e.target?.innerText
        copyToClipboard(text)

        toast.info(`Value: "${text}" has been copied to Clipboard`, {autoClose: 3000})
      }

      function onlyCars(clientTel) {
        return recivedVehicles.map(car => car).filter(item => item?.Tel === clientTel)
      }

			async function relocateFunc(carData, targetVIN) {
				const confirmUnassign = await relocateCarsFunc(carData, targetVIN)
					if (confirmUnassign !== false) {
						toast.dismiss()
						toast.success('Successfully deleted vehicle assigment.')
						let filterVehicles = recivedVehicles.map(car => car.VIN === targetVIN ? car.Tel = '' : car)
            setRecivedVehicles(filterVehicles)
					}
			}

      function redirectToClientDetails(client) {
          getClientData(client)
          navigate(`/clients/details/${client.Tel}`)
      }
      function openClientEditForm(client) {
          getClientData(client)
          navigate(`/clients/details/${client.Tel}/edit`)
      }

      function redirectToCarDetails(vehicle, client) {
          getClientData(client)
          getVehicleData(vehicle)
          navigate(`/vehicles/details/${vehicle.VIN}`)
      }
			 function openVehicleEditForm(vehicle) {
          getVehicleData(vehicle)
          navigate(`/vehicles/details/${vehicle.VIN}/edit`)
			 }

      function openVehicleAddForm(Tel) {
          getActivePhoneNumber(Tel)
          toast.success(`Phone number ${Tel} has been copied to clipboard!`)
          navigate(`/vehicles`)
      }



    const tableHeader = 
    <div className="flex justify-content-between flex-column sm:flex-row">
        <Button icon="pi pi-filter-slash" label="Clear" className="p-button-outlined" onClick={() => clearTableFilters()} />
        <div className="my-3 sm:my-0 text-center">{ recivedClients?.length || 0 } of { totalNumberOfClients } clients available for search</div>
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText placeholder="Filter..." onKeyUp={(e) => showEvent(e.target.value.trim())} tooltip="Type at least 3 characters to search" tooltipOptions={{position: 'left'}}/>
        </span>
    </div>

    const optionsBody = (data) => {
      return(
        <div className="flex flex-column align-items-center">
        <div className="flex flex-row pb-2 pointer">
          <i className="fas fa-edit pr-3" tooltip="Edit client's data" onClick={() => openClientEditForm(data)}></i>
          <i className="fas fa-trash-alt" tooltip="Delete client's data"
                onClick={() => confirmDeleteModal(data, 'removeClient')}></i>
        </div>
        <div className="flex flex-row pointer">
          <i className="fas fa-info-circle pr-2" tooltip="Client details" onClick={() => redirectToClientDetails(data)}></i>
          <i className="fas fa-plus" tooltip="Assign new vehicle to the client" onClick={() => openVehicleAddForm(data.Tel)}><i className="fas fa-car"></i></i>
        </div>
      </div>
      )}

    const telephoneBody = ({Tel, Tel2}) => {
        return(
            <div className="flex flex-column text-center mx-auto" onDoubleClick={(e) => copyValue(e)} style={{width: '96px', maxWidth:'120px'}}>
                <div>{Tel}</div>
                <div className={Tel2 ? "" : 'hidden'}> { Tel2 }</div>
            </div>
        )}
    
    const clientNameBody = ({Imie, NIP}) =>{
        return(
            <div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
                <div className="pointer">{Imie}</div>
                <div className={"pointer" + NIP ? '' : 'hidden'}> { NIP }</div>
            </div>
        )}

    const vehiclesBody = (data) => {
        return(
            <div className="flex flex-column smaller-font-for-phones lower-margin" onDoubleClick={(e) => copyValue(e)}>
        		<div className="flex flex-column">
            {onlyCars(data.Tel).map((car) => {
                return(
								<div key={car.VIN} className="Cars">
                  <div className="flex flex-row align-items-center justify-content-between" id={`id${car.VIN}`}>
                    <div className="flex flex-column">
                      <div className="text-center text-wrap font-bold">{`${car.Marka} ${car.Model}`}</div>
                      <div className="text-center white-space-nowrap overflow-hidden text-overflow-ellipsis width-160-for-phones" style={{width:'220px', maxWidth:'225px'}}>{car.VIN}</div>
                    </div>
                    <div className="flex flex-row justify-content-end align-items-center lower-margin pl-1 pointer">
											<i className="fas fa-minus" tooltip="Delete vehicle bindings to the client" onClick={() => relocateFunc(car, car.VIN)}><i className="fas fa-car"></i></i>
											<i className="fas fa-info-circle px-2" tooltip="Vehicle Details" onClick={() => redirectToCarDetails(car, data)}></i>
											<i className="fas fa-edit" tooltip="Edit Vehicle's data" onClick={() => openVehicleEditForm(car)}></i>
                    </div>
                  </div>
									<Divider />
								</div>)
            	})
						}
      	</div>
      	</div>
        )}



    return(<>
    <div className="flex flex-column">

    <div className="flex flex-column align-items-center justify-content-center">
        <Button label="Add new client" icon="pi pi-user-plus" onClick={() => navigate('/clients/create-new')}
            className="p-button-outlined p-button-success flex align-items-center my-3" />
        <Button className={`p-button-secondary p-flex column mb-3 ${disableNextButton ? 'hidden' : ''}`} onClick={() => getClientsFromFirebase('all')} label="Get all clients from Firestore" 
                icon={(!recivedClients || isLoading) ? 'pi pi-spin pi-spinner' : 'pi pi-download'} />
    </div>

 <DataTable header={tableHeader} loading={!recivedClients || isLoading} value={recivedClients} responsiveLayout="stack" breakpoint="1280px" 
            stripedRows rows={20} showGridlines className="p-my-5" filters={tableFilters} dataKey="Tel" filterDisplay="menu" paginator>

    <Column style={{width: '45px'}} className="text-center" body={(data) => recivedClients.indexOf(data)+1}></Column>
    <Column header="ACTIONS" className="text-center" body={optionsBody} />
    <Column field="Tel2" className="hidden" />
    <Column field="Tel" header="Phone Number" className="text-center" body={telephoneBody} />
    <Column field="Imie" header="Client Name" className="text-center" body={clientNameBody} />
    <Column field="Opis" header="Description" className="text-center" body={({Opis}) => <div className="px-4 text-wrap" dangerouslySetInnerHTML={{__html: Opis}}></div>} />
    <Column header="Vehicles" className="p-text-center" style={{width:'270px'}} field="Pojazdy" body={vehiclesBody} />
    {/* Whole vehicle component is rendered above */}
    {/* Below columns are hidden, because they are needed just to filter in the search box */}
    <Column header="VIN" className="hidden" field={({Tel}) => onlyCars(Tel).map(car => car.VIN)} />
    <Column header="Manufacture and Model" className="hidden" field={({Tel}) => onlyCars(Tel).map(car => `${car.Marka} ${car.Model}`)} />
 </DataTable> 

<Button className={`p-button-secondary my-4 mx-auto ${disableNextButton ? 'hidden' : ''}`} onClick={() => getClientsFromFirebase('more')} 
        label="Download another 50 clients" icon={(!recivedClients || isLoading) ? 'pi pi-spin pi-spinner' : 'pi pi-download'} />

</div>
    </>)
}

export default ManageClients