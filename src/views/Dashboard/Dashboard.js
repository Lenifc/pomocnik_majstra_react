import { toast } from 'react-toastify';
import { useState, useEffect, useRef } from 'react';

import diff from '../../components/compareTwoArrays.js'

import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column'
import { Fieldset } from 'primereact/fieldset'
import { FilterMatchMode } from 'primereact/api'

import copyToClipboard from '../../components/copyToClipboard'

import firebase from 'firebase/app'

import ReactJson from 'react-json-view'


function Dashboard(){

    const [counterTickets, setCounterTickets] = useState('')
    const [counterClients, setCounterClients] = useState('')
    const [counterVehicles, setCounterVehicles] = useState('')
    const [currentUserName, setCurrentUserName] = useState('')
    const [workshopName, setWorkshopName] = useState('')
    const [logs, setLogs] = useState('')
    
    const [isLoading, setIsLoading] = useState(true)
	const limit = useRef(50)
	const [disableNextButton, setDisableNextButton] = useState(false)
    
	const [tableFilters, setTableFilters] = useState({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
	const clearTableFilters = () => { setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})}
    
    
    const MainPath = firebase.firestore().collection('logs')
    const counterPathTickets = firebase.firestore().collection('warsztat').doc('zlecenia')
    const counterPathClients = firebase.firestore().collection('warsztat').doc('Klienci')
    const counterPathVehicles = firebase.firestore().collection('warsztat').doc('Pojazdy')
    const workshopDetails = firebase.firestore().collection('warsztat').doc('DaneDoFaktur')
    const auth = firebase.auth()


    function showEvent(searchVal) {
        if (searchVal.length > 2) setTableFilters({ 'global': { value: searchVal, matchMode: FilterMatchMode.CONTAINS }})
        else setTableFilters({ 'global': { value: '', matchMode: FilterMatchMode.CONTAINS }})
    }

    function copyValue(e) {
        const text = e.target?.innerText
        copyToClipboard(text)

        toast.info(`Value: "${text}" has been copied to Clipboard`, {autoClose: 3000})
    }

     function lookForChanges(previousData, newData, type){
       let result
       if(type === "Modyfikacja danych") result = diff(previousData, newData)
       if(type === "Utworzenie danych") result = newData
       if(type === "Usuwanie danych") result = previousData

       return result
     }

     async function getAllActivityHistory(req) {
       if (req === 'more') limit.current += 100

       let logsPath = MainPath
         .orderBy("id", "desc")
         .limit(limit.current)

       if (req === 'all') {
         logsPath = MainPath.orderBy("id", "desc")
         setIsLoading(true)
       }

       let downloadedLogs = await logsPath.get()

       if (!downloadedLogs.docs.length) {
         setDisableNextButton(true)
         toast.add({ severity: 'info', detail: 'All activities have been downloaded!', life: 4000 })
       }

       setLogs(downloadedLogs.docs.map(log => log.data()))

       setIsLoading(false)
       setDisableNextButton(false)

       if (req === 'all' || downloadedLogs.docs.length < limit.current) {
         setDisableNextButton(true)
         toast.info('All activities have been downloaded!')
       }
     }

     async function getCounters() {
         try{
             const clientsResult = await counterPathClients.get()
             const vehiclesResult = await counterPathVehicles.get()
             const ticketsResult = await counterPathTickets.get()
             const docs = await workshopDetails.get()
             if(docs && docs.data) localStorage.setItem('nazwaWarsztatu', docs?.data()?.nazwaWarsztatu)
     
             setCurrentUserName(auth.currentUser.providerData[0])
     
             setIsLoading(false)
             limit.current = 50
     
             setCounterVehicles(vehiclesResult.data())
             setCounterClients(clientsResult.data())
             setCounterTickets(ticketsResult.data())
         }
         catch(err){
             toast.error(err.message)
         }
     }



      useEffect(() => {
        if(localStorage.getItem('nazwaWarsztatu')) setWorkshopName(localStorage.getItem('nazwaWarsztatu'))
        else setWorkshopName('Warsztat')

        getAllActivityHistory()
        getCounters()
      }, [])

    const cardHeader = <>
        <div className="text-center py-2">Currently signed in: <span className="text-bold">{currentUserName.displayName || currentUserName.email || currentUserName.phoneNumber}</span></div>
        <h2 className="text-center py-0 sm:py-2">General data:</h2>
    </>

    const tableHeader =         
    <div className="flex justify-content-between flex-column sm:flex-row">
        <Button icon="pi pi-filter-slash" label="Clear" className="p-button-outlined" onClick={() => clearTableFilters()}
                tooltip="Clear filters" />
        <div className="my-3 sm:my-0 text-center">Downloaded { logs?.length } last activities</div>
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText placeholder="Filter..." onKeyUp={(e) => showEvent(e.target.value.trim())} tooltip="Type at least 3 characters to search" tooltipOptions={{position: 'left'}}/>
        </span>
    </div>

    const showTaskChanges = data => {
        return( 
        <div onClick={() => { }}>

        { data.task === 'Modyfikacja danych' && 
        <Fieldset  legend="Details" toggleable={true} collapsed={true} >
          Modified parts:
          <ReactJson src={lookForChanges(data.previousData, data.newData, data.task)} theme="solarized" />
        </Fieldset> }

        { data.task==='Utworzenie danych' && 
        <Fieldset legend="Details" toggleable={true} collapsed={true} >
          Newly created data:
          <ReactJson src={data.newData} theme="solarized" />
        </Fieldset> }

        { data.task==='Usuwanie danych' && 
        <Fieldset legend="Details" toggleable={true} collapsed={true} >
            Data no longer exists:
            <ReactJson src={data.previousData} theme="solarized" />
        </Fieldset> }

      </div>)
    }


    return(
    <div className="home" style={{maxWidth: '1200px', margin: '0 auto'}}>
    <div className="flex flex-row justify-content-center align-items-center py-5">
      <div style={{width: 'min(150px, 25vw)'}}>
        <img alt="(Logo)" src="../assets/logo.svg" style={{width: '100%', filter: 'invert(100%)'}} />
      </div>
      <div><h1>{ workshopName }</h1></div>
    </div>

    <Card header={cardHeader}>
        <div className="flex flex-column sm:flex-row justify-content-center align-items-center">
          { counterClients && <div className="flex flex-column py-1 sm:py-0 pr-0 sm:pr-4">
            <h3>Tasks: <span> {counterTickets.IloscZlecen} </span></h3>
            <div>Waiting: <span>{counterTickets.Wolne}</span></div>
            <div>in Progress: <span>{counterTickets.Obecne}</span></div>
            <div>Archived: <span>{counterTickets.Zakonczone}</span></div>
          </div> }
          { counterClients && <div className="flex flex-column">
            <div>Clients in total: <span>{counterClients.Klienci}</span></div>
            <div>Vehicles in total: <span>{counterVehicles.Pojazdy}</span></div>
          </div> }
        { !counterClients && <ProgressSpinner animationDuration="0.5s" /> }
        </div>
    </Card>

    <div className="flex flex-column justify-content-center">
      <h1 className="text-center pt-4">History Monitor</h1>
      { !disableNextButton && <Button className="p-button-secondary mt-3" onClick={() => getAllActivityHistory('all')} label="Download all activities"
                icon={(!logs || isLoading) ? 'pi pi-spin pi-spinner' : 'pi pi-download'} /> }
    </div>
    
    <DataTable value={logs} responsiveLayout="stack" breakpoint="1150px" stripedRows paginator={true} rows={20}
      showGridlines filters={tableFilters} filterDisplay="menu" loading={!logs || isLoading} className="my-5" header={tableHeader}>

        <Column field="id" header="ID" style={{width:'50px'}} className="text-center" 
                body={({id}) => <div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
                    <div className="pointer">{id}</div>
                </div>} />
      <Column field="task" header="Activity type" className="text-center" style={{width:'100px'}} body={({task}) => {
        if(task === 'Modyfikacja danych') return 'Existing data has been modified'
        if(task === 'Usuwanie danych') return 'Deleted data'
        if(task === 'Utworzenie danych') return 'Created new data'
        if(task === 'Logowanie do aplikacji') return 'User signed in'
        return task
      }} />

      <Column field="target" header="Target" className="text-center" style={{width:'130px'}} body={({target}) =>  <div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
            <div className="pointer">{target}</div>
          </div>} />
      <Column field="message" header="Description" className="text-center" style={{width:'125px'}} body={({message}) => <div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
            <div className="pointer">{message}</div>
          </div>} />

      <Column field="localTime" header="Event time" className="text-center" style={{width:'100px'}} body={({localTime}) => <div className="flex flex-column" onDoubleClick={(e) => copyValue(e)}>
            <div className="pointer">{localTime}</div>
          </div>} />
      
        {/* Try to re-build below solution to look like on a github comparison */}
       <Column header="Changes" className="text-center" style={{width:'330px'}} body={(data) => showTaskChanges(data)} />

    </DataTable>
  </div>
  )
}

export default Dashboard