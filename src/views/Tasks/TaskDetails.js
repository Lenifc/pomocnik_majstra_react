import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { Card } from 'primereact/card'

import { toast } from 'react-toastify'

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useContext } from 'react'

import ContextStore from '../../store/ContextStore'
import { getTime } from '../../components/getCurrentTime'

import firebase from 'firebase/app'

import { DeleteFunc, RelocateTicket } from '../../components/EditMoveDeleteOptions'
import RelocateTicketDialog from './TasksComponents/RelocateTicketsDialog';
import WorkOrderForm from './TasksComponents/WorkOrderForm'
import VehicleEntryProtocol from './TasksComponents/VehicleEntryProtocol'

function TaskDetails(){

    const tickets = firebase.firestore()
                            .collection('warsztat')
                            .doc('zlecenia')

    const navigate = useNavigate()
    const { taskID, collectionPath } = useParams()

    const { activeTask, getActiveInvoice } = useContext(ContextStore)

    const [showModal, setShowModal] = useState(false)
    const [modalMsg, setModalMsg] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    const [ticketDetails, setTicketDetails] = useState('')

    const [polishNamedCollectionPath, setPolishNamedCollectionPath] = useState('')


    useEffect(() => {
        if(activeTask.length) setTicketDetails(activeTask)
        else {
            let targetPath = collectionPath
            if(targetPath === 'new') targetPath = 'wolne' 
            if(targetPath === 'inprogress') targetPath = 'obecne' 
            if(targetPath === 'closed') targetPath = 'zakonczone' 
            setPolishNamedCollectionPath(targetPath)
            fetchData(targetPath)
        }
    },[])


    async function fetchData(targetPath) {
        try{
            let data = await tickets.collection(targetPath).doc(`zlecenie-${taskID}`).get()
            if(data.exists) setTicketDetails(data.data())
            else throw Error('No data at given path. It may be recently moved or deleted!')
            setIsLoading(false)

        } catch(err){
            toast.error(err.message)
        }
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
          if (confirmDelete !== false) navigate(-1)
        },
        reject: () => {}
      });
    }


    async function updateTicket() {
      let updatedTicket = []

      updatedTicket = ticketDetails

      updatedTicket.Aktualizacja = getTime()

      const { id } = ticketDetails
      const ticketStatus = polishNamedCollectionPath

      const collectionReference = tickets.collection(ticketStatus).doc(`zlecenie-${id}`)

      try{
        const doc = await collectionReference.get()
        if(doc.exists){
            await collectionReference.update({...updatedTicket})
            toast.success("Ticket's data successfully updated")
        } 
        else throw Error('Unable to find data. It is probably already deleted.')
      } 
      catch(err){
        toast.error(err.message)
      }
    }

    function setWOItems(data){
      setTicketDetails({...ticketDetails, Wykonane_uslugi_czesci: data})
    }
      

    async function OpenInvoiceVizualization() {
        const invoiceData = {
          phoneNum: ticketDetails.Tel,
          vehicleVIN: ticketDetails.VIN,
          ticketID: taskID
        }
        getActiveInvoice(invoiceData)
        navigate('/generate-invoice-preview')
      }

      function showStatus(path){
        if(path === 'new') return 'New'
        if(path === 'inprogress') return 'In Progress'
        if(path === 'closed') return 'Archived'
      }


    function openRelocateDialog(ticketInfo) {
      setModalMsg(`Where do we move task ${ticketInfo['id']}?`)
      setShowModal(true)
    }

    async function modalResponse(response, newLocation) {
        try{
            const { id } = ticketDetails
            if (newLocation === polishNamedCollectionPath) throw Error(`Cannot relocate task to the same location..`)
            if (response === true) {
              const { ConfirmRelocate, clientIsOffline} = await RelocateTicket('Ticket', ticketDetails, tickets, polishNamedCollectionPath, newLocation, id)
              if(clientIsOffline) throw Error('Client is offline.\n Cannot perform action without internet connection.')
              if (ConfirmRelocate !== false) {
                navigate(`tasks/${newLocation}`)
                toast.dismiss()
                toast.success(`Successfully relocated ticket to ${newLocation}`)
                setShowModal(false)
            }
        } else {
            setShowModal(false)
            return
        }
        }
        catch(err){
            toast.warn(err.message)
        }  
    }


    const cardTitle= <>
        <div style={{position: 'absolute', top: '0px', right: '10px', fontSize: '2.2rem', cursor: 'pointer'}} onClick={() => navigate(-1)}>&times;</div>
        <div className="text-center">Details of task {taskID}</div>
    </>

    const cardFooter =  <div className="flex flex-column sm:flex-row justify-content-center">
        <Button disabled={isLoading} className="p-button-success mx-1 my-1 sm:my-0" onClick={() => updateTicket()}
        label="Update changes" icon="pi pi-pencil" />
        <Button disabled={isLoading} className="p-button-warning mx-1 my-2 sm:my-0"
                onClick={() => openRelocateDialog(ticketDetails)} label="Relocate" icon="fas fa-arrows-alt-h" />
        <Button disabled={isLoading} className="p-button-danger mx-1 my-2 sm:my-0"
                onClick={() => confirmDeleteModal(ticketDetails)} icon="pi pi-trash" label="Delete Ticket" />
        {polishNamedCollectionPath === 'zakonczone' && ticketDetails?.['Wykonane_uslugi_czesci']?.length > 0 && 
        <Button disabled={isLoading} className="p-button-help mx-1 my-1 sm:my-0" label="Generate Invoice"
                onClick={() => OpenInvoiceVizualization()}  icon="pi pi-print" /> }
  </div>



    return(<>
    {showModal && <RelocateTicketDialog message={modalMsg} submit={(status, newLocation) => modalResponse(status, newLocation)} abort={() => modalResponse(false)} />}
    
    <Card className="mt-6 relative" style={{maxWidth:'1200px', margin: '0 auto'}} title={cardTitle} footer={cardFooter}>
        {isLoading && <i className="flex justify-content-center pi pi-spin pi-spinner" /> }
        { !isLoading && <div>
          <div id={ticketDetails?.['id']} className="column">
            <div className="flex flex-column md:flex-row justify-content-center">

              <div className="client mr-0 mb-5 md:mr-5 md:mb-0">
                <h3 className="mb-2" style={{color:'var(--yellow-500)'}}>Klient:</h3>
                <div>Name:  {ticketDetails?.['Imie'] }</div>
                { ticketDetails?.NIP && <div>Tax number: { ticketDetails.NIP}</div>}
                <div>Contact number: { ticketDetails?.['Tel'] }</div>
              </div>
              <div className="vehicle mr-0 mb-5 md:mr-5 md:mb-0">
                <h3 className="mb-2" style={{color:'var(--yellow-500)'}}>Pojazd:</h3>
                <div>Manufacturer: { ticketDetails?.['Marka'] }</div>
                <div>Model: { ticketDetails?.['Model'] }</div>
                <div>Generation: { ticketDetails?.['Wersja_Rocznik'] || "Data not provided"}</div>
                <div>VIN: { ticketDetails?.['VIN'] }</div>
                <div>Vehicle Number Plate: { ticketDetails?.['Numer_rejestracyjny'] }</div>
                <div>Fuel: { ticketDetails?.['Paliwo']?.name || "Data not provided"}</div>
                { ticketDetails?.['Silnik_Pojemnosc'] && ticketDetails?.['Silnik_Moc'] && ticketDetails?.['Silnik_Kod'] && <div>
                  Engine details:
                  { ticketDetails?.['Silnik_Pojemnosc'] }cm<sup>3</sup> ; { ticketDetails?.['Silnik_Moc'] }KM ;
                  { ticketDetails?.['Silnik_Kod'] }</div>}

                <div>Drive type: { ticketDetails?.['Naped'] || "Data not provided"}</div>
                <div>Transmission type: { ticketDetails?.['SkrzyniaBiegow'] || "Data not provided"}</div>
                { ticketDetails?.['Przebieg'] && <div>Mileage: { ticketDetails?.['Przebieg'] }km</div>}
              </div>
            </div>
            <div className="text-center mt-4">
              <h3 className="mb-2" style={{color:'var(--yellow-500)'}}>Details:</h3>
              <div>id: { ticketDetails?.['id'] }</div>
              <div>Ticket's Status: <span className="font-bold">{showStatus(collectionPath)}</span></div>
              <div>Created at: { ticketDetails?.['Dodane_Czas'] }</div>
              { collectionPath === 'closed' && <div>Closed at: { ticketDetails?.['Zakonczone_Czas'] }</div> }
              { ticketDetails?.['Opis'] && <div>Description:
                  <div dangerouslySetInnerHTML={{__html: ticketDetails['Opis']}}></div> 
              </div>}
            </div>
          </div>

          <div className="flex flex-column justify-content-center mt-5">
            <VehicleEntryProtocol protocolData={ticketDetails?.['ProtokolPrzyjecia']} triggerProtocol={(data) => setTicketDetails({...ticketDetails, ProtokolPrzyjecia: data})}/> 
            <WorkOrderForm passedWO={ticketDetails?.['Wykonane_uslugi_czesci']} WOItems={(data) => setWOItems(data)} />
          </div>
        </div>}

    </Card>
    
    </>)
}

export default TaskDetails