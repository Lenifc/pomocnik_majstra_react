import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { FilterMatchMode } from 'primereact/api'
import { confirmDialog } from 'primereact/confirmdialog'


import { toast } from 'react-toastify'

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useContext } from 'react'

import ContextStore from '../../store/ContextStore'


import copyToClipboard from '../../components/copyToClipboard.js'

import firebase from 'firebase/app'

import { DeleteFunc, RelocateTicket } from '../../components/EditMoveDeleteOptions'
import RelocateTicketDialog from './TasksComponents/RelocateTicketsDialog';


function ManageTasks(){

    const [tableFilters, setTableFilters] = useState({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
	const clearTableFilters = () => { setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})}

    const { pathname } = useLocation()
    const navigate = useNavigate()
    const [collectionPath, setCollectionPath] = useState('')
  
    const { activeTask, getActiveTask } = useContext(ContextStore)

    const [allTasks, setAllTasks]  = useState([])

	const [isLoading, setIsLoading] = useState(true)
	const [totalNumberOfTasks, setTotalNumberOfTasks] = useState(0)
    const limit = useRef(50)
	const [disableNextButton, setDisableNextButton] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [modalMsg, setModalMsg] = useState('')

    const tickets = firebase.firestore()
                    .collection('warsztat')
                    .doc('zlecenia')


    useEffect(() => {
        limit.current = 50
        getDataFromFirebase()
    }, [pathname])


    async function getDataFromFirebase(req) {
        let ticketPath 
        if(pathname.substring(7) === 'new') ticketPath = 'wolne'
        if(pathname.substring(7) === 'inprogress') ticketPath = 'obecne'
        if(pathname.substring(7) === 'closed') ticketPath = 'zakonczone'

        setCollectionPath(ticketPath)

        setIsLoading(true)

    try{
        if (req === 'more') limit.current += 50

        const collectionReference = tickets.collection(ticketPath).orderBy('Aktualizacja', 'desc')
            .limit(limit.current)

        // variables in firestore are saved with Uppercase naming
        let totalTasks = (await tickets.get()).data()?.[ticketPath[0].toUpperCase() + ticketPath.substring(1)]
        setTotalNumberOfTasks(totalTasks)

        let data = await collectionReference.get()
        if(data.empty) throw Error('Tasks list is empty!')
        else{
            setAllTasks(data.docs.map(doc => doc.data()))

            setIsLoading(false)
            setDisableNextButton(false)
            if (data.docs.length < limit.current) {
                setDisableNextButton(true)
                toast.dismiss()
                toast.info('All tasks have been downloaded!')
            }
        }
    }
    catch(err){
        setIsLoading(false)
        setDisableNextButton(true)
        toast.error(err.message)
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


    function redirectToDetails(ticketData) {
        getActiveTask(ticketData)
        navigate(`/tasks/details/${pathname.substring(7)}/${ticketData['id']}`)
    }

    
    const confirmDeleteModal = (ticketData) => {
      confirmDialog({
        message: `Are you sure you want to delete client's task ${ticketData.Tel},
        Vehicle: ${ticketData.Marka} ${ticketData.Model}?`,
        header: `Delete confirmation`,
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-success',
        rejectClassName: 'p-button-danger',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: async () => {
          const { id } = ticketData

          const currentPath = tickets.collection(collectionPath)
          const confirmDelete = await DeleteFunc('Ticket', currentPath, id)
          if (confirmDelete !== false) setAllTasks(allTasks.filter(ticket => ticket.id !== id))
        },
        reject: () => {}
      });
    }


    function openRelocateDialog(ticketInfo) {
      getActiveTask(ticketInfo)
      setModalMsg(`Where do we relocate ticket of client: ${ticketInfo['Tel']}?`)

      setShowModal(true)
    }

    async function modalResponse(response, newLocation) {
        try{
            if (newLocation === collectionPath) throw Error(`Cannot relocate task to the same location..`)
            if (response === true) {
              const { ConfirmRelocate, clientIsOffline} = await RelocateTicket('Ticket', activeTask, tickets, collectionPath, newLocation, activeTask.id)
              if(clientIsOffline) throw Error('Client is offline.\n Cannot perform action without internet connection.')
              if (ConfirmRelocate !== false) {
                setAllTasks(allTasks.filter(car => car.id !== activeTask.id))
            }
        } else {
            setShowModal(false)
            return
        }
            toast.success(`Successfully relocated ticket to ${newLocation}`)
            setShowModal(false)
        }
        catch(err){
            toast.warn(err.message)
        }
        
    }


    const tableHeader =  
	<div className="flex justify-content-between flex-column md:flex-row">
        <Button icon="pi pi-filter-slash" label="Clear" className="p-button-outlined" onClick={() => clearTableFilters()} tooltip='Clear' />
        <div className="my-3 md:my-0 text-center">{allTasks.length === totalNumberOfTasks ? 'All' :`${allTasks.length } of ${ totalNumberOfTasks }`} tasks available for search</div>
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText placeholder="Filter..." onKeyUp={(e) => showEvent(e.target.value.trim())} tooltip="Type at least 3 characters to search" tooltipOptions={{position: 'left'}}/>
        </span>
    </div>

    const optionsBody = (data) => {
        return(
        <div className="flex justify-content-center mx-0">
            <Button onClick={() => redirectToDetails(data)}
                    className="p-button-outlined p-button-rounded p-button-primary" icon="fas fa-info-circle" 
                    tooltip="Szczegóły zlecenia" />
            <Button onClick={() => openRelocateDialog(data)}
                    className="p-button-outlined p-button-rounded p-button-warning mx-1 xlg:mx-2 relocate" icon="fas fa-arrows-alt-h"
                    tooltip="Przenieś zlecenie" />
            <Button onClick={() => confirmDeleteModal(data)}
                    className="p-button-outlined p-button-rounded p-button-danger remove" icon="fas fa-trash-alt"
                    tooltip="Usuń zlecenie" />
        </div>
        )
    }


    return(
    <div className="flex flex-column align-items-streach">
        <h1 className="my-3 mx-auto">Tickets {collectionPath === 'wolne' ? 'waiting to do.' : 
                                            (collectionPath === 'obecne' ? 'inprogress.' : 
                                            (collectionPath === 'zakonczone' ? 'archived.' : 
                                            'Something broke...'))}</h1>
        <div className="flex align-items-center justify-content-center">
            { !disableNextButton && <Button className="p-button-secondary my-4" label="Download 50 more tasks" onClick={() => getDataFromFirebase('more')} icon="pi pi-download" /> }
        </div>

    <DataTable value={allTasks} responsiveLayout="stack" stripedRows showGridlines filters={tableFilters} dataKey="id"
      filterDisplay="menu" loading={isLoading} header={tableHeader} className="my-5" breakpoint="1050px" paginator rows={20}>

        <Column style={{width: '45px'}} className="text-center" body={(data) => allTasks.indexOf(data)+1} />
        <Column header="ACTIONS" className="text-center" style={{width:'160px'}} body={optionsBody} />
        <Column field="Dodane_Czas" header="Created at:" className={'text-center'} 
                style={{width:'140px'}} />
        <Column field="Imie" header="Client" className="text-center" body={(data) => <div onDoubleClick={(e) => copyValue(e)}>{ data['Imie'] }</div>} />
        <Column field="Tel2" className="hidden" />
        <Column field="Tel" header="Phone Number" className="text-center" style={{width:'130px'}} body={(data) => <div onDoubleClick={(e) => copyValue(e)}>{ data['Tel'] }</div>} />

        <Column field="Model" className="hidden" />
        <Column field="VIN" className="hidden" />
        <Column field="Marka" header="Vehicle" style={{width:'200px'}} className="text-center" body={(data) => {
            return (<>
                <div onDoubleClick={(e) => copyValue(e)}>{ `${data['Marka']} ${data['Model']} ${(data['Wersja_Rocznik'] || '')}` }</div>
                <div onDoubleClick={(e) => copyValue(e)}>{ `${data['VIN']}` }</div>
            </>)
        }} />

        <Column field="Numer_rejestracyjny" header="Number Plate" className="text-center" body={(data) => <div onDoubleClick={(e) => copyValue(e)}>{ data['Numer_rejestracyjny'] }</div>} />
        <Column field="Zakonczone_Czas" header="Closed at:" className={`text-center ${collectionPath === 'zakonczone' ? '' : 'hidden'}`} style={{width:'150px'}} />
    </DataTable>

    {showModal && <RelocateTicketDialog message={modalMsg}
     submit={(status, newLocation) => modalResponse(status, newLocation || '')} abort={() => modalResponse(false)} />}
  </div>
)
}

export default ManageTasks