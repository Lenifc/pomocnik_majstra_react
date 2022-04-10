import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Fieldset } from 'primereact/fieldset';
import { Button } from 'primereact/button'

import { toast } from 'react-toastify'
import { useState } from 'react'

import { callTicketsHistory } from '../../components/fetchTicketHistory'


export default function TicketsHistory({VIN, Tel}){

    const [historyLoaded, setHistoryLoaded] = useState(false)
    const [isAnyDataInHistory, setIsAnyDataInHistory] = useState()
    const [ticketsHistory, setTicketsHistory] = useState([])


    function calcTotalCosts(order) {
        let totalGross = 0
        let totalNet = 0
        if(order) order.forEach(item => {
            totalGross += Number(item['totalCost_gross'])
            totalNet += Number(item['totalCost_net'])
        })
        return `<div>Total Gross: <span style="color: var(--primary-color)">${totalGross.toFixed(2)} </span>PLN</div>
                <div>Total Net: <span style="color: var(--primary-color)" >${totalNet.toFixed(2)} </span>PLN</div>`
    }

    function showName(name) {
        if (name === 'wolne') return 'New'
        if (name === 'obecne') return 'in Progress'
        if (name === 'zakonczone') return 'Closed'
    }

    const fetchHistoryTicketsResults = async () => {

        let tryFetch = 0
        setTicketsHistory([])
        let results = await callTicketsHistory(VIN, Tel)
        setTicketsHistory(results)
        // check for await issue here... 
        let check
        // temporary workaround for async await calling function isse above
        check = setInterval(() => {
            if (!results.length) {
                if (tryFetch > 3) {
                    clearInterval(check)
                    toast.dismiss()
                    toast.error('An error occured while searching for tickets history! ')
                }
            } else {
                let anyData = results.some(ticket => ticket[1].length > 0)
                setIsAnyDataInHistory(results.some(ticket => ticket[1].length > 0)) // check if there is any data in all 3 arrays
                setHistoryLoaded(true)
                if (!anyData) {
                    toast.dismiss()
                    toast.warn('Ticket history for this vehicle is empty!')
                }
                clearInterval(check)
            }
            tryFetch += 1
        }, 500)
    }

    return(
    <div className="mt-6 mb-3 text-center">
    { !historyLoaded && <Button label="Check vehicle service history." className="p-button-info"
                                icon="pi pi-download" onClick={() => fetchHistoryTicketsResults()} />}
    {historyLoaded && <h3>Vehicle's service history:</h3>}
    {ticketsHistory.length > 0 && <div className="text-left">
        {ticketsHistory.map(ticket => { return (<div key={ticket} id={ticket[0]}>
            {ticket[1].length > 0 && <>
                <Fieldset style={{ padding: '3px!important' }} legend={showName(ticket[0])} toggleable={true} collapsed={true}
                            className="my-2">
                { ticket[1].map(unique => {return (<div key={unique.id} className="text-center" id={ticket[0]}>
                    <Fieldset style={{ padding: '3px!important' }} legend={`Utworzone: ${unique['Dodane_Czas']}`} toggleable={true} collapsed={true}
                                className="my-2">
                        <div className="fieldset-data my-2">
                            <div>Ticket's ID: 
                                <a className="font-bold" href={`/tasks/details/${ticket[0] === 'nowe' ? 'new' : (ticket[0] === 'obecne' ? 'inprogress' : 'closed')}/${unique?.['id']}`}> { unique.id }</a>
                            </div>
                            <div>Client's Name / Company: { unique['Imie'] }</div>
                            <div>Contact phone number: { unique?.['Tel'] }</div>
                            <div>Ticket's Status: <span className="font-bold">{showName(ticket[0])}</span></div>
                            { unique.Przebieg && <div>Mileage: { unique.Przebieg } km</div>}
                            <div className="mt-2">Created at: {unique['Dodane_Czas']}</div>
                            { unique['Zakonczone_Czas'] && ticket[0] === 'zakonczone' && <div>Closed at: {unique['Zakonczone_Czas']}</div>}
                        </div>

                        { unique['Wykonane_uslugi_czesci'].length > 0 && <>
                            { ticket[0] === 'wolne' && <div>Recently created tasks:</div> }
                            { ticket[0] === 'obecne' && <div>Tasks in progress:</div> }
                            { ticket[0] === 'zakonczone' && <div>Closed tasks:</div> }
                            <DataTable value={unique['Wykonane_uslugi_czesci']} responsiveLayout="scroll" stripedRows showGridlines
                                        className="my-2 text-center datatable-sm" dataKey="id" header={<div dangerouslySetInnerHTML={{ __html: calcTotalCosts(unique['Wykonane_uslugi_czesci']) }}></div>}>

                                <Column style={{width: '45px'}} className="text-center" body={(data) => unique['Wykonane_uslugi_czesci'].indexOf(data)+1} />
                                <Column field="part_service_Name" header="Nazwa:" className="text-center" body={data => <div className="text-left">{data['part_service_Name'] || ''}</div>}/>
                                <Column field="quantity" header="Ilość" />
                                <Column field="price_net" header="Cena Netto[PLN]:" />
                                <Column field="totalCost_net" header="Wartość Netto[PLN]:" />
                                <Column field="tax" header="Stawka VAT[%]:" />
                                <Column field="price_gross" header="Cena Brutto[PLN]:" />
                                <Column field="totalCost_gross" header="Wartość Brutto[PLN]:" />
                            </DataTable>
                        </>}
                        { !unique['Wykonane_uslugi_czesci'].length && <div>This ticket has empty price estimate!</div> }
                    </Fieldset>
                </div> )} )}
                </Fieldset> 
            </>}
        </div> )} )}
    </div>}
    { !isAnyDataInHistory && historyLoaded && <div>This vehicle has empty service history.</div> }
  </div>)
}