import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { FilterMatchMode } from 'primereact/api'
import { confirmDialog } from 'primereact/confirmdialog'

import { toast } from 'react-toastify'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'

import ContextStore from '../../store/ContextStore'

import firebase from 'firebase/app'

import { callTicketsHistory } from '../../components/fetchTicketHistory'
import { DeleteFunc, relocateCarsFunc } from '../../components/EditMoveDeleteOptions'
import copyToClipboard from '../../components/copyToClipboard'


function ManageVehicles(){

	const navigate = useNavigate()

	const { getVehicleData } = useContext(ContextStore)
	const [recivedVehicles, setRecivedVehicles]  = useState([])

	const [isLoading, setIsLoading] = useState(true)
	const [totalNumberOfVehicles, setTotalNumberOfVehicles] = useState(0)
	const [downloadLimit, setDownloadLimit] = useState(50)
	const [disableNextButton, setDisableNextButton] = useState(false)

	const [tableFilters, setTableFilters] = useState({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
	const clearTableFilters = () => { setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})}


	const MainPath = firebase.firestore()
	.collection('warsztat').doc('Pojazdy').collection('VIN')

	const totalVehiclesPath = firebase.firestore()
		.collection('warsztat').doc('Pojazdy')


	useEffect(() => {
		getVehiclesFromFirebase()
	},[])


    async function getVehiclesFromFirebase(req) {
		let limit = 50
        if (req === 'more') {
			limit += 100
			setDownloadLimit(downloadLimit+100)
		}

        let vehiclePath = MainPath
        	.orderBy("Ostatnia_Aktualizacja", "desc")
        	.limit(req === 'more' ? downloadLimit+100 : downloadLimit )

        if (req === 'all') {
    		vehiclePath = MainPath.orderBy("Ostatnia_Aktualizacja", "desc")
    		setIsLoading(true)
        }

       const clientResponse = await vehiclePath.get()

       const getAllVehicles = (await totalVehiclesPath.get()).data().Pojazdy
			 setTotalNumberOfVehicles(getAllVehicles)


       if (!clientResponse.docs.length) {
         setDisableNextButton(true)
         toast.info('All vehicles have been downloaded!')
       }

       setRecivedVehicles(clientResponse.docs.map(doc => doc.data()))

       setIsLoading(false)
       setDisableNextButton(false)

       if (req === 'all' || clientResponse.docs.length < limit) {
         setDisableNextButton(true)
         toast.info('All vehicles have been downloaded!')
       }
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

		 
		async function relocateFunc(carData, target, extraInfo) {
			const confirmUnassign = await relocateCarsFunc(carData, target)
			if (confirmUnassign !== false) {
			    toast.dismiss()
			    if(carData.Tel) toast.success('Successfully deleted vehicle assigment.')
			    if(extraInfo) toast.info('Vehicle has service history records which does not allow to delete this vehicle from database.', {autoClose: 9000})
			    let filterVehicles = recivedVehicles.map(car => car.VIN === target ? {...car, Tel: ''} : car)
				setRecivedVehicles(filterVehicles)
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
			  accept:async () => {
				if(checkForTickets === false){
					let confirm = await DeleteFunc('Vehicle', MainPath , VIN)
					if(confirm !== false) setRecivedVehicles(recivedVehicles.filter(car => car.VIN !== VIN))
				} else {
					toast.error("Vehicle has ticket history records!")
				}
			  },
			  reject: () => {}
			})
		}

	function openPhoneNumberModal(data){
		//TODO...
		// Since then just redirect to EditForm
		//
		openVehicleEditForm(data)
	}

    function openVehicleEditForm(car) {
		getVehicleData(car)
        navigate(`/vehicles/details/${car.VIN}/edit`)
    }

    function openVehicleAddForm() {
    	navigate('/vehicles/create-new')
    }

    function redirectToCarDetails(car) {
		getVehicleData(car)
        navigate(`/vehicles/details/${car.VIN}`)
    }

		//
		//	JSX section below	 
		//
	const tableHeader = <div className="flex justify-content-between flex-column md:flex-row">
          <Button icon="pi pi-filter-slash" label="Clear" className="p-button-outlined" onClick={() => clearTableFilters()} tooltip='Clear' />
          <div className="my-3 md:my-0 text-center">{ recivedVehicles?.length } of { totalNumberOfVehicles } vehicles available for search</div>
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText placeholder="Filter..." onKeyUp={(e) => showEvent(e.target.value.trim())} tooltip="Type at least 3 characters to search" tooltipOptions={{position: 'left'}}/>
        </span>
      </div>

	const optionsBody = (data) => {
			return(	
			<div className="flex flex-column align-items-center pointer">
        <div className="flex flex-row pb-2">
          <i className="fas fa-edit pr-3" tooltip="Edit vehicle's data" onClick={() => openVehicleEditForm(data)} />
          <i className="fas fa-trash-alt" tooltip="Delete vehicle's data" onClick={() => confirmDeleteModal(data.VIN)} />
        </div>
        <div className="flex flex-row">
          <i className="fas fa-info-circle pr-3" tooltip="Vehicle details" onClick={() => redirectToCarDetails(data)}></i>
          {!data.Tel && <i className="pi pi-user-plus" style={{fontSize: '1.55rem'}} tooltip="Assign vehicle to a client" onClick={() => openPhoneNumberModal(data)}></i>}
          {data.Tel && <i className="pi pi-user-minus" style={{fontSize: '1.55rem'}} tooltip="Delete any bindings with clients" onClick={() => relocateFunc(data, data.VIN)}></i>}
        </div>
      </div>)
	}
	const phoneNumBody = ({Tel}) => {
		return (
		<div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
			{Tel && <div className="pointer">{Tel}</div>}
			{!Tel && <div className="font-bold">UNASSIGNED</div>}
		</div>)
	}
	const manufactureBody = ({Marka, Model, Wersja_Rocznik}) => {
		return (
		<div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
			<div className="pointer">{`${Marka} ${Model}`}</div>
			<div className="pointer">{`${Wersja_Rocznik || ''}`}</div>
		</div>)
	}
	const numberPlateBody = ({Numer_rejestracyjny}) => {
		return (
		<div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
        	<div className="pointer">{Numer_rejestracyjny}</div>
      	</div>)
	}
	const VINBody = ({VIN}) => {
		return (
		<div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
			<div className="pointer " style={{display:'block', maxWidth:'197px'}}>{VIN}</div>
		</div>)
	}
	const mileageBody = ({Przebieg}) => {
		return (
		<div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
			<div className="pointer">{Przebieg} {Przebieg ? 'km' : null}</div>
		</div>)
	}


    return(
      <div className="flex flex-column">
        <div className="flex flex-column align-items-center justify-content-center">
          <Button label="Add new vehicle" icon="pi pi-plus-circle" onClick={() => openVehicleAddForm()}
            			className="p-button-outlined p-button-success flex align-items-center my-3" />
          {!disableNextButton && <Button className="p-button-secondary flex column" onClick={() => getVehiclesFromFirebase('all')} label="Get all vehicles from Firestore" 
                  											 icon={(!recivedVehicles || isLoading) ? 'pi pi-spin pi-spinner' : 'pi pi-download'} />}
        </div>
            

        <DataTable value={recivedVehicles} responsiveLayout="stack" breakpoint="1280px" stripedRows paginator rows={20}
            		showGridlines filters={tableFilters} filterDisplay="menu" loading={!recivedVehicles || isLoading} className="my-5" 
								dataKey="VIN" header={tableHeader}>

			<Column style={{width: '45px'}} className="text-center" body={(data) => recivedVehicles.indexOf(data)+1} />
            <Column header="Actions" className="text-center" style={{width:'64px'}} body={optionsBody} />
            <Column field="Tel2" className="hidden" />
            <Column field="Tel" header="Client's Phone Number" className="text-center" style={{width:'130px'}} body={phoneNumBody} />
            <Column field="Marka" header="Vehicle" className="text-center" style={{width:'175px'}} body={manufactureBody} /> 
            <Column field="Model" className="hidden" />
            <Column field="Wersja_Rocznik" className="hidden" />
            <Column field="Numer_rejestracyjny" header="Number Plate" className="text-center" style={{width:'120px', overflow:'hidden '}} body={numberPlateBody} />
            <Column field="VIN" header="VIN" className="text-center" style={{width:'230px', overflow:'hidden'}} body={VINBody} />
            <Column field="Przebieg" header="Mileage" className="text-center" style={{width:'150px'}} body={mileageBody} />
            <Column field="Opis" header="Description" className="text-center" body={(data) => <div className="px-4 text-wrap" dangerouslySetInnerHTML={{__html: data.Opis}}></div>} 
										style={{maxWidth:'270px', wordWrap: 'break-word', overflow: 'hidden'}} />
        </DataTable>

        { !disableNextButton && <Button className="p-button-secondary mb-6" onClick={() => getVehiclesFromFirebase('more')} 
            label="Download another 100 vehicles" icon="pi pi-download" />}

        </div>
    )
}

export default ManageVehicles