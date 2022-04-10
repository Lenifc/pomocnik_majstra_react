import firebase from 'firebase/app'

import WorkOrderForm from './TasksComponents/WorkOrderForm'

import { getTime } from '../../components/getCurrentTime'
import BasicVehicleList from './TasksComponents/BasicVehicleList'
import VehicleEntryProtocol from './TasksComponents/VehicleEntryProtocol'

import { toast } from 'react-toastify'

import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { RadioButton } from 'primereact/radiobutton'
import { Editor } from 'primereact/editor'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'



function NewTaskForm(){

    const navigate = useNavigate()

    const [openClientsModal, setOpenClientsModal] = useState(false)
    const [selectedVehicle, setSelectedVehicle] = useState('')
    const [selectedClient, setSelectedClient] = useState('')
    const [newTaskState, setNewTaskState] = useState('wolne')
    const [taskDescription, setTaskDescription] = useState('')
    const [protocolData, setProtocolData] = useState('')
    const [WOItems, setWOItems] = useState('')

    const tickets = firebase.firestore()
                            .collection('warsztat')
                            .doc('zlecenia')


    function validateData() {
        let currentTime = getTime()
        let ID = Date.now()

        let preparedData = {
          id: ID,

          Tel: selectedClient.Tel,
          Imie: selectedClient.Imie,
          NIP: (selectedClient.Rodzaj === 'Firma' || selectedClient.Rodzaj === 'Company') ? selectedClient.NIP  : '',
          kodPocztowy: selectedClient.kodPocztowy ? selectedClient.kodPocztowy : '',
          Miejscowosc: selectedClient.Miejscowosc ? selectedClient.Miejscowosc : '',
          Ulica: selectedClient.Ulica ? selectedClient.Ulica : '',

          Marka: selectedVehicle?.["Marka"],
          Model: selectedVehicle?.['Model'],
          Wersja_Rocznik: selectedVehicle?.['Wersja_Rocznik'] || "",
          Paliwo: selectedVehicle?.['Paliwo'] || "",

          Silnik_Pojemnosc: selectedVehicle?.['Silnik_Pojemnosc'] || "",
          Silnik_Moc: selectedVehicle?.['Silnik_Moc'] || "",
          Silnik_Kod: selectedVehicle?.['Silnik_Kod'] || "",
          SkrzyniaBiegow: selectedVehicle?.['SkrzyniaBiegow'] || "",
          Naped: selectedVehicle?.['Naped'] || "",
          Numer_rejestracyjny: selectedVehicle?.['Numer_rejestracyjny'] || "",
          VIN: selectedVehicle?.['VIN'],
          Przebieg: selectedVehicle?.['Przebieg'] || "",

          Opis: taskDescription || "",
          Wykonane_uslugi_czesci: WOItems,
          Dodane_Czas: selectedVehicle?.['Dodane_Czas'] || currentTime,
          ProtokolPrzyjecia: protocolData || '',
          Zakonczone_Czas: '',
          Aktualizacja: currentTime
        }

        sendDataToFirebase(preparedData, newTaskState)
    }

    async function sendDataToFirebase(preparedData, picked) {
      let ID = preparedData.id

      const collectionReference = tickets.collection(picked)
      const docReference = collectionReference.doc(`zlecenie-${ID}`)

      try{
        const getDoc = await docReference.get()
        if(!getDoc.exists){
          await docReference.set({...preparedData})
          updateCounters()
          toast.success(`New task has been created to ${picked === 'wolne' ? 'New' : (picked === 'obecne' ? 'In Progress' : 'Closed')}!`)
        } else throw Error('Cannot create new task. Validation went wrong!')
      } catch(err) {
        toast.error(err.message)
      }
    }

    function updateCounters(){
      // this function will be removed then I move it to Server side functions
      tickets.update("IloscZlecen", firebase.firestore.FieldValue.increment(1))
      if(newTaskState === 'zakonczone') tickets.update("Zakonczone", firebase.firestore.FieldValue.increment(1))
      if(newTaskState === 'obecne') tickets.update("Obecne", firebase.firestore.FieldValue.increment(1))
      if(newTaskState === 'wolne') tickets.update("Wolne", firebase.firestore.FieldValue.increment(1))
      
      clearForm()
    }

    function clearForm() {
      setSelectedVehicle('')
      setSelectedClient('')
      setNewTaskState('')
    }




    const cardFooter = () => { 
    return (
        selectedVehicle && <div className="flex flex-column sm:flex-row justify-content-center" >
            <Button className="p-button-success mr-0 sm:mr-2 mb-2 sm:mb-0" onClick={() => validateData()} label="Create task" icon="pi pi-plus" />
            <Button className="p-button-danger" onClick={() => clearForm()} label="Clear form" icon="pi pi-trash" />
        </div>
    )}

    const editorTemplate = 
    <span className="ql-formats">
      <button className="ql-bold"></button>
      <button className="ql-italic"></button>
      <button className="ql-underline"></button>
      <button className="ql-list" value="bullet"></button>
      <button className="ql-link"></button>
    </span>

    return(
        <div className="pt-5">
        { openClientsModal && <BasicVehicleList closeClientModal={() => { setOpenClientsModal(false)}} provideVehicleData={(data) => setSelectedVehicle(data)} provideClientData={(data) => setSelectedClient(data)}/>}
        { !openClientsModal && 
        <Card className="text-center mx-auto" style={{maxWidth:'1100px'}} footer={cardFooter}>
      
            <form className="newDataForm">
              <div className="flex flex-column justify-content-center sm:flex-row ml-4 sm:ml-0">
                <div className="mr-0 mb-5 sm:mb-0 sm:mr-6" style={{maxWidth:'320px'}}>
                  <p>Client & Vehicle already added to database:</p>
                  <Button className="p-button-primary mt-2" label={`${!selectedVehicle ? 'Choose client' : 'Choose another client'}`} onClick={(e) => {e.preventDefault(); setOpenClientsModal(true)}} />
                </div>
                { !selectedVehicle && <div style={{maxWidth:'280px'}}>
                  <p>New client: </p>
                  <Button className="p-button-primary mt-2" label="Create new client" onClick={() => navigate('/clients/create-new/')} />
                </div>}
              </div>
              { selectedVehicle && <div className="newDataForm">
                <div className="selectedClient">
                  <h3 className="pt-2">Selected:</h3>
                  <p className="pt-1">Vehicle: </p>
                  <div className="font-bold my-1" style={{color:'var(--yellow-500)'}}>
                    { `${selectedVehicle.Marka} ${selectedVehicle.Model} ${selectedVehicle.VIN}`}
                  </div>
                  <p>Client:</p>
                  <div style={{color:'var(--blue-400)'}} className="font-bold">{ selectedClient?.Tel }</div>
                  <div>{ selectedClient?.Imie }</div>
                  { selectedClient.NIP && <div>TAX number: { selectedClient?.NIP }</div>}
                  { selectedClient.KodPocztowy && selectedClient.Miejscowosc && selectedClient.Ulica && <div>
                      { `${selectedClient?.KodPocztowy} ${selectedClient?.Miejscowosc} - ${selectedClient?.Ulica} street` }</div>}
                </div>
      
                <label htmlFor="Textarea">
                  <h3 className="mt-3 mb-1 text-center">Extra description:</h3>
                </label>
                <Editor id="Textarea" value={taskDescription} headerTemplate={editorTemplate} onChange={(e) => setTaskDescription(e.htmlValue)} 
                        className="mx-auto mt-4 mb-6" style={{height: '200px'}}>
                </Editor>
      
                <div>
                  <VehicleEntryProtocol triggerProtocol={(data) => setProtocolData(data)} />
                  <WorkOrderForm WOItems={(data) => setWOItems(data)} />
                </div>
      
                <h2 className="my-2">Create as:</h2>
                <div className="flex flex-column justify-content-center">
                  <span className="mb-1">
                    <RadioButton id="waiting" name="ticket" value="wolne" checked={newTaskState === 'wolne'} onChange={(e) => setNewTaskState(e.value)} />
                    <label htmlFor="waiting"> New</label>
                  </span>
                  <span>
                    <RadioButton id="inprogress" name="ticket" value="obecne" checked={newTaskState === 'obecne'} onChange={(e) => setNewTaskState(e.value)} />
                    <label htmlFor="inprogress"> In progress</label>
                  </span>
                </div>
      
              </div> }
            </form>
      
        </Card>
        }
      </div>
      )
}

export default NewTaskForm