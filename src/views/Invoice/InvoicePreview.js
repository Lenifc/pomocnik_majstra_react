import { createPDF, fetchInvoiceData } from '../../components/CreatePDF'
import ContextStore from '../../store/ContextStore'

import { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'

import firebase from 'firebase/app'

import './InvoicePreview.css'

function InvoicePreview(){

    const navigate = useNavigate()

    const [workshopDetails, setWorkshopDetails] = useState('')
    const [ticketDetails, setTicketDetails] = useState('')
    const [clientDetails, setClientDetails] = useState('')
    const [vehicleDetails, setVehicleDetails] = useState('')
    const [allInOneData, setAllInOneData] = useState('')

    const { activeInvoice } = useContext(ContextStore)

    const randomIndex = Math.floor((Math.random()*123)+2)
    const getYear = new Date().getFullYear()
    const getTodaysDate = new Date().toLocaleDateString()


    function saveToLocalStorage(){
        let requiredData = {
          clientData: clientDetails,
          vehicleData: vehicleDetails,
          invoiceData: ticketDetails,
          workshopData: workshopDetails,
          invoiceNumber: randomIndex,
          getYear: getYear,
          getTodaysDate: getTodaysDate
        }
        setAllInOneData(requiredData)
        fetchInvoiceData(requiredData)
      }


    useEffect(() => {
        if(activeInvoice){
            fetchTicketDetails()
            fetchClientDetails()
            fetchWorkshopDetails()
        } else navigate(-1)
    },[])

    useEffect(() => {
        saveToLocalStorage()
    },[clientDetails, vehicleDetails, workshopDetails, ticketDetails])

  
    function generatePDF(){
        const call = firebase.functions().httpsCallable('GenerateInvoice')
        call({...allInOneData})
        
        createPDF()
    }
  
  
    async function fetchTicketDetails() {
        const ticketPath = firebase.firestore()
                                    .collection('warsztat').doc('zlecenia').collection('zakonczone').doc(`zlecenie-${activeInvoice.ticketID}`)
  
        let ticketData = (await ticketPath.get()).data()
        if(ticketData) setTicketDetails(ticketData)
    }
  

    async function fetchClientDetails() {
        const clientPath = firebase.firestore()
                            .collection('warsztat').doc('Klienci').collection('Numery').doc(activeInvoice.phoneNum)
  
        const vehiclePath = firebase.firestore()
                            .collection('warsztat').doc('Pojazdy').collection('VIN').doc(activeInvoice.vehicleVIN)
  
      try{
        const clientResponse = (await clientPath.get()).data()
        const vehicleResponse = (await vehiclePath.get()).data()
  
        if(clientResponse) setClientDetails(clientResponse)
        else setClientDetails(ticketDetails)
        
        if(vehicleResponse) setVehicleDetails(vehicleResponse)
        else setVehicleDetails(ticketDetails)
      } 
      catch(error){
        console.log(error);
        toast.error(error.message)
      }
    }
  

    async function fetchWorkshopDetails(){
        const workshopPath = firebase.firestore()
                                    .collection('warsztat').doc('DaneDoFaktur')
  
        let workshopData = (await workshopPath.get()).data()
        if(workshopData) setWorkshopDetails(workshopData)
    }
  
    function calcTotalCosts(order) {
        let totalGross = 0
        let totalNet = 0
        if(order) order.forEach(item => {
          totalGross += Number(item['totalCost_gross'])
          totalNet += Number(item['totalCost_net'])
        })
    return `<h2>Total costs:  <span class="font-bold" style="color: var(--pink-600)">${totalGross.toFixed(2)}</span>zł
                  <div class="text-normal" style="font-size: 1.1rem">Net: <span style="color: var(--pink-600)">${totalNet.toFixed(2)}</span>zł</div>
                </h2>`
    }
  

    return(
        <div className="mt-5 mb-3">
        <Button label="Generate Invoice" className="flex mx-auto" onClick={() => generatePDF()} />
        <div className="card my-6">
          <div className="card-content">
            <div className="card-header mt-4">
              <div className="flex flex-row justify-content-between align-items-center">
                <div className="invoice-logo flex flex-row align-items-center">
                  {/* <div style="width: 80px"><img alt="workshopLogo" src="@/assets/logo.svg" style={{width: '100%'}}></div> */}
                  <div className="workshopTitle text-uppercase font-bold">{workshopDetails?.['nazwaWarsztatu']}</div>
                </div>
                <div className="invoice-title text-right font-bold">
                  INVOICE number { randomIndex }/{ getYear }
                </div>
                <div>Generated at: { getTodaysDate }</div>
              </div>
              <div className="mt-4">
                <h3 className="text-uppercase">Serivce provider</h3>
                <div>{ workshopDetails?.['nazwaFirmy'] }</div>
                <div>{ `${workshopDetails?.['kodPocztowy']} ${workshopDetails?.['miejscowosc']}`}</div>
                <div>{ workshopDetails?.['adres'] }</div>
                <div>NIP: { workshopDetails?.['NIP'] }</div>
                <div>Tel: { workshopDetails?.['numerTelefonu'] }</div>
                <div>email: { workshopDetails?.['email'] }</div>
                <div>nr konta bankowego: { workshopDetails?.['kontoBankowe'] }</div>
              </div>
      
              { clientDetails && <div className="mt-3">
                <h3 className="text-uppercase">Customer</h3>
                <div>{ clientDetails?.['Imie'] || ticketDetails?.['Imie']}</div>
                { (clientDetails?.['NIP'] || ticketDetails?.['NIP']) && <div>NIP: { clientDetails?.['NIP'] || ticketDetails?.['NIP'] }</div>}
                <div>Tel: { clientDetails?.['Tel'] || ticketDetails?.['Tel']}</div>
                { ((clientDetails?.['KodPocztowy'] && clientDetails?.['Miejscowosc']) || (ticketDetails?.['KodPocztowy'] && ticketDetails?.['Miejscowosc'])) && <div>
                  { `${clientDetails?.['KodPocztowy']} ${clientDetails?.['Miejscowosc']}` || `${ticketDetails?.['KodPocztowy']} ${ticketDetails?.['Miejscowosc']} `}
                  </div>}
                <div>{ clientDetails?.['Ulica'] || ticketDetails?.['Ulica']}</div>
                <br/><br/>
                { vehicleDetails && <div >{ `${vehicleDetails?.['Marka']?.toUpperCase()} ${vehicleDetails?.['Model']} ${vehicleDetails?.['Wersja_Rocznik'] || ''}, ${
                vehicleDetails?.['VIN']}, ${vehicleDetails?.['Numer_rejestracyjny'] || ''} ${vehicleDetails?.['Przebieg'] ?  ', Stan licznika: ' + vehicleDetails?.['Przebieg'] + 'km' : ''}`}</div>}
              { ticketDetails && !vehicleDetails && <div>{ `${ticketDetails?.['Marka']?.toUpperCase()} ${ticketDetails?.['Model']} ${ticketDetails?.['Wersja_Rocznik'] || ''}, ${
                ticketDetails?.['VIN']}, ${ticketDetails?.['Numer_rejestracyjny'] || ''} ${ticketDetails?.['Przebieg'] ?  ', Stan licznika: ' + ticketDetails?.['Przebieg'] + 'km' : ''}`}</div>}
              </div>}
              { !clientDetails && <div className="mt-2"><h3>Client's data have been removed from database!</h3></div>}
      
            </div>
            <div className="card-main mt-4">
              { ticketDetails?.['Wykonane_uslugi_czesci']?.length &&  
              <DataTable value={ticketDetails?.['Wykonane_uslugi_czesci']} responsiveLayout="scroll">
                <Column style={{width: '45px'}} className="text-center" body={(data) => ticketDetails?.['Wykonane_uslugi_czesci'].indexOf(data)+1} />
                <Column field="part_service_Name" header="Parts name" className="text-left"></Column>
                <Column field="quantity" header="Quantity [piece/liters]" className="text-center" style={{width: '60px'}}></Column>
                <Column field="price_net" header="Price Net[zł]" className="text-right"></Column>
                <Column field="totalCost_net" header="Total Net[zł]" className="text-right"></Column>
                <Column field="tax" header="TAX" className="text-center" body={data => `${data.tax}%`} />
                <Column field="price_gross" header="Price Gross[zł]" className="text-right"></Column>
                <Column field="totalCost_gross" header="Total Gross[zł]" className="text-right"></Column>
              </DataTable>}
             
      
              <div className="mt-5 mb-3">
                <div dangerouslySetInnerHTML={{__html: calcTotalCosts(ticketDetails?.['Wykonane_uslugi_czesci'])}}></div>
                <div>Payed in cash</div>
              </div>     
              
            </div>
            <div className="flex flex-row justify-content-evenly mt-8">
              <div className="client w-150 text-center">
                <Divider />
                Customer signature
              </div>
              <div className="seller w-150 text-center">
                <Divider />
                Seller signature
              </div>
            </div>
            <div className="card-footer text-center mt-6">
              <span>{ workshopDetails?.['stopka'] }</span>
            </div>
          </div>
        </div>
      </div>)
}

export default InvoicePreview