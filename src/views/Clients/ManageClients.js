import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext'
import { FilterMatchMode } from 'primereact/api';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';

import { useEffect, useRef, useState } from 'react';

import firebase from 'firebase/app'

import copyToClipboard from '../../components/copyToClipboard.js'

import './ManageClients.css'

function ManageClients(){

    const [isLoading, setIsLoading] = useState(true)
    const [recivedClients, setRecivedClients] = useState([])
    const [recivedVehicles, setRecivedVehicles] = useState([])
    const [totalNumberOfClients, setTotalNumberOfClients] = useState(0)
    const [downloadLimit, setDownloadLimit] = useState(50)
    const [disableNextButton, setDisableNextButton] = useState(false)

    const [tableFilters, setTableFilters] = useState({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
    const clearTableFilters = () => { setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})}

    const toast = useRef()

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
         toast.current.clear()
         toast.current.show({ severity: 'info', detail: 'All clients have been downloaded!', life: 4000 })
       }
     }


    const confirmDeleteModal = async (clientData) => {
        console.log(clientData);

        // confirm.require({
        //   message: `Czy napewno chcesz usunąć klienta o podanym numerze telefonu: ${clientData['Tel']}?`,
        //   header: `Usuń klienta`,
        //   icon: 'pi pi-exclamation-triangle',
        //   acceptClass: 'p-button-success',
        //   rejectClass: 'p-button-danger',
        //   acceptLabel: 'Tak',
        //   rejectLabel: 'Nie',
        //   accept: async () => {
        //     const { Tel } = clientData
 
        //       const confirmDelete = await DeleteFunc('client', MainPath, Tel)
        //       if (confirmDelete !== false) {
        //         recivedClients.value = recivedClients.value.filter(client => client.Tel != Tel)
        //         toast.removeAllGroups()
        //         toast.add({ severity: 'success', detail: 'Pomyślnie usunięto dane klienta', life: 4000 })
        //       }
        //   },
        //   reject: async () => {}
        // })
      }
      function showEvent(searchVal) {
        if (searchVal.length > 2) setTableFilters({ 'global': { value: searchVal, matchMode: FilterMatchMode.CONTAINS }})
        else setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
      }

      function copyValue(e) {
        const text = e.target?.innerText
        copyToClipboard(text)

        toast.current.show({severity: 'info', summary: 'Value copied', detail: `Value: "${text}" has been copied to Clipboard`, life: 3000})
      }

      function onlyCars(clientTel) {
        return recivedVehicles.map(car => car).filter(item => item?.Tel === clientTel)
      }


			async function relocateFunc(carData, target, extraInfo) {
				// const confirmUnassign = await relocateCarsFunc(carData, target)
				// 	if (confirmUnassign !== false) {
				// 		toast.removeAllGroups()
				// 		toast.add({severity:'success', detail:'Pomyślnie usunięto powiązanie pojazdu z klientem.', life: 4000})
				// 		if(extraInfo) toast.add({severity:'info', detail:'Pojazd zawiera historię serwisową przez co nie można go całkowicie usunąć z bazy.', life: 8000})
				// 		recivedVehicles.value.map(car => car.VIN == target ? car.Tel = '' : car)
				// 	}
			}



			 function openVehicleEditForm(item) {
				//  store.commit('setTargetCar', item)
				//  Router.push(`/pojazd/${item.VIN}/edytuj`)
			 }
			 function redirectToCarDetails(car, data) {
				//  store.commit('setTargetCar', car)
				//  store.commit('setTargetClient', data)
				//  Router.push(`/szczegoly/${car.VIN}`)
			 }

      function openClientEditForm(item) {
        // store.commit('setTargetClient', item)
        // Router.push(`/klient/${item.Tel}/edytuj`)
        console.log(item);
      }

      function openVehicleAddForm(Tel) {
          console.log(Tel);
        // store.commit('setNumberForNewVehicle', Tel)
        // Router.push('/pojazd/dodaj')
      }
      function redirectToClientDetails(client) {
          console.log(client);
        // store.commit('setTargetClient', client)
        // Router.push(`/szczegoly/client/${client.Tel}`)
      }

      function openClientAddForm() {
        // Router.push(`/klient/dodaj`)
      }




    const tableHeader = 
    <div className="flex justify-content-between flex-column sm:flex-row">
        <Button icon="pi pi-filter-slash" label="Clear" className="p-button-outlined" onClick={() => clearTableFilters()} />
        <div className="my-3 sm:my-0 text-center">{ recivedClients?.length || 0 } of { totalNumberOfClients } clients available</div>
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

    const telephoneBody = (data) => {
        return(
            <div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
                <div>{data.Tel}</div>
                <div className={data.Tel2 ? "" : 'hidden'}> { data.Tel2 }</div>
            </div>
        )}
    
    const clientNameBody = (data) =>{
        return(
            <div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
                <div className="pointer">{data.Imie}</div>
                <div className={"pointer" + data.NIP ? '' : 'hidden'}> { data.NIP }</div>
            </div>
        )}

    const vehiclesBody = (data) => {
        return(
            <div className="flex flex-column smallerFontOnPhones lowerMargin" onDoubleClick={(e) => copyValue(e)}>
        		<div className="flex flex-column">
            {onlyCars(data.Tel).map((car) => {
                return(
								<div key={car.VIN} className="Cars">
                  <div className="flex flex-row align-items-center justify-content-between" id={`id${car.VIN}`}>
                    <div className="flex flex-column">
                      <div className="text-center text-wrap text-bold">{`${car.Marka} ${car.Model}`}</div>
                      <div className="text-nowrap text-truncate width160OnPhones" style={{width:'220px', maxWidth:'225px'}}>{car.VIN}</div>
                    </div>
                    <div className="flex flex-row justify-content-end align-items-center lowerMargin pl-1 pointer">
											<i className="fas fa-minus" tooltip="Usuń powiązanie pojazdu z klientem" onClick={() => relocateFunc(car, car.VIN)}><i className="fas fa-car"></i></i>
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
    <Toast ref={toast} />
    <div className="flex flex-column">

    <div className="flex flex-column align-items-center justify-content-center">
        <Button label="Add new client" icon="pi pi-user-plus" onClick={() => openClientAddForm()}
            className="p-button-outlined p-button-success flex align-items-center my-3" />
        <Button className={`p-button-secondary p-flex column mb-3 ${disableNextButton ? 'hidden' : ''}`} onClick={() => getClientsFromFirebase('all')} label="Get all clients from Firestore" 
            v-if="!disableNextButton" icon={(!recivedClients || isLoading) ? 'pi pi-spin pi-spinner' : 'pi pi-download'} />
    </div>

 <DataTable header={tableHeader} loading={!recivedClients || isLoading} value={recivedClients} responsiveLayout="stack" breakpoint="1280px" 
            stripedRows rows={20} showGridlines className="p-my-5" filters={tableFilters} dataKey="Tel" filterDisplay="menu" paginator>

    <Column style={{width: '45px'}} className="text-center" body={(data) => recivedClients.indexOf(data)+1}></Column>
    <Column header="ACTIONS" className="text-center" body={optionsBody} />
    <Column field="Tel2" className="hidden" />
    <Column field="Tel" header="Phone Number" className="text-center" body={telephoneBody} />
    <Column field="Imie" header="Client Name" className="text-center" body={clientNameBody} />
    <Column field="Opis" header="Description" className="text-center" body={(data) => <div className="px-4 text-wrap" dangerouslySetInnerHTML={{__html: data.Opis}}></div>} />
    <Column header="Vehicles" className="p-text-center" style={{width:'270px'}} field="Pojazdy" body={vehiclesBody} />
 </DataTable> 

<Button className={`p-button-secondary my-4 mx-auto ${disableNextButton ? 'hidden' : ''}`} onClick={() => getClientsFromFirebase('more')} 
        label="Download another 50 clients" icon={(!recivedClients || isLoading) ? 'pi pi-spin pi-spinner' : 'pi pi-download'} />

</div>
    </>)
}

export default ManageClients