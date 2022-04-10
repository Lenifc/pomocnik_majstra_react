import { useState,useEffect } from 'react'
import './WorkOrderForm.css'

import { toast } from 'react-toastify'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'

function WorkOrderForm({passedWO, WOItems}){

    const cleanWO = useState({
        part_service_Name: '',
        quantity: 1,
        price_net: null,
        price_gross: 0,
        tax: 23,
        totalCost_net: 0,
        totalCost_gross: 0,
    })
    const [WO, setWO] = useState(cleanWO[0])
    const [items, setItems] = useState([])


    useEffect(() => {
        if(passedWO && passedWO.length) setItems(passedWO)
    },[])

    useEffect(() => {
        WOItems(items)
    }, [items])


      // recalculate already added and edited data
    const onRowEditComplete = (e) => {
        let { newData, index } = e
        let __items = [...items]

        if(!newData.tax || newData.tax < 0) newData.tax = 0 
        if(!newData.quantity || newData.quantity < 0) newData.quantity = 1 
        if(!newData.price_net || newData.price_net < 0) newData.price_net = 0 

        if (newData.price_net && newData.price_net > 0 && newData.quantity > 0) newData = {...newData, 
            price_gross: Number(Math.abs(Number(newData.price_net) * (newData.tax > 0 ? (Number(newData.tax) + 100) / 100 : 1)).toFixed(2)),
            totalCost_net: Number(Math.abs(Number(newData.quantity) * Number(newData.price_net)).toFixed(2)),
            totalCost_gross: Number(Math.abs(Number(newData.quantity) * Number(newData.price_net) * (newData.tax > 0 ? (Number(newData.tax) + 100) / 100 : 1) ).toFixed(2))
        }
        else newData = {...newData, 
            price_gross: 0,
            totalCost_net: 0,
            totalCost_gross: 0
        }
          
        __items[index] = newData
        setItems(__items)
    }


    function clearInputs() {
        setWO(cleanWO[0])
    }

      // validate new WorkOrder and add it to array
    function addNewWO() {
      document.querySelectorAll('.p-invalid').forEach(input => input.classList.remove('p-invalid'))

      if(!WO.quantity || WO.quantity < 0) document.querySelector('#quantityWO').classList.add('p-invalid')
      if(!WO.part_service_Name) document.querySelector('#serviceWO').classList.add('p-invalid')
      if(!WO.price_net || WO.price_net < 0) document.querySelector('#priceNetWO').classList.add('p-invalid')
      if(WO.tax && WO.tax < 0) document.querySelector('#taxWO').classList.add('p-invalid')
      let checkForInvalids = document.querySelectorAll('.p-invalid')

      if (checkForInvalids.length === 0) {

        let newItems = [...items, {
            id: Date.now(),
            part_service_Name: WO.part_service_Name || ' ',
            quantity: Math.abs(WO.quantity),
            price_net: Math.abs(WO.price_net),
            price_gross: WO.price_gross,
            tax: Math.abs(WO.tax) || 0,
            totalCost_net: WO.totalCost_net.toFixed(2),
            totalCost_gross: WO.totalCost_gross.toFixed(2)
        }]
        setItems(newItems)

        clearInputs()
      } else toast.warn('Check for invalid/empty inputs!')
    }


    function deleteWO(data) {
        const target = data.id
        setItems(items.filter(item => item.id !== target))
    }
    

        //costs displayed above WorkOrder table
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

        // Recalculate prices in real-time 
    useEffect(() => {
        if (WO.price_net && WO.price_net > 0 && WO.quantity > 0) setWO({...WO, 
            price_gross: Number(Math.abs(Number(WO.price_net) * (WO.tax > 0 ? (Number(WO.tax) + 100) / 100 : 1)).toFixed(2)),
            totalCost_net: Number(Math.abs(Number(WO.quantity) * Number(WO.price_net)).toFixed(2)),
            totalCost_gross: Number(Math.abs(Number(WO.quantity) * Number(WO.price_net) * (WO.tax > 0 ? (Number(WO.tax) + 100) / 100 : 1) ).toFixed(2))
        })
        else setWO({...WO, 
            price_gross: 0,
            totalCost_net: 0,
            totalCost_gross: 0
        })
    }, [WO.price_net, WO.quantity, WO.tax])


    return (<>
    <div className="flex justify-content-center align-items-center pt-5">
    </div>
    
    <div style={{maxWidth:'1200px'}} className="pb-4">
      { items.length > 0 && 
      <DataTable value={items} dataKey="id" editMode="row" header={<div dangerouslySetInnerHTML={{__html: calcTotalCosts(items)}}></div>}
                onRowEditComplete={(e) => onRowEditComplete(e)} stripedRows showGridlines
                responsiveLayout="stack" breakpoint="1100px" className="datatable-sm pt-4 text-center">

        <Column style={{width: '45px'}} className="text-center" body={(data) => items.indexOf(data)+1} />
        <Column field="part_service_Name" header="Part Name:" editor={(options) => <InputText value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />}/>
        <Column field="quantity" header="Quantity:" editor={(options) => <InputNumber className="quantityWOCurrent" prefix="x " value={options.value} style={{width:'84px'}} 
                                                                                      onChange={(e) => options.editorCallback(e.value)} />} />
        <Column field="price_net" header="Retail Net[PLN]:" editor={(options) => <InputNumber className="price_netWOCurrent" mode="currency" currency="PLN" value={options.value}
                                                                                              style={{width:'127px'}} onChange={(e) => options.editorCallback(e.value)} />} />
        <Column field="totalCost_net" header="Total Net[PLN]:" />
        <Column field="tax" header="Tax rate[%]:" editor={(options) => <InputNumber className="taxWOCurrent" suffix="%" value={options.value} style={{width:'77px'}} 
                                                                                    onChange={(e) => options.editorCallback(e.value)} />} />
        <Column field="price_gross" header="Retail Gross[PLN]:" />
        <Column field="totalCost_gross" header="Total Gross[PLN]:" />
        <Column header="Edit" rowEditor={true} style={{textAlign:'center', width: '5%', minWidth:'3.75rem'}} />
        <Column header="Delete" style={{width: '5%', minWidth:'3.5rem', textAlign: 'center'}} 
                body={(data) => <Button className="p-button-danger p-button-rounded" icon="pi pi-trash" onClick={() => deleteWO(data)} />
        } />

      </DataTable>
      }
    </div>

      <div className="workOrder flex justify-content-center align-items-center pt-3">
        <div className="workOrderItem flex flex-column md:flex-row align-center align-items-center text-center flex-wrap ">
          <div className="flex flex-column mt-2 md:mt-0 serviceWO">
            <label className="pb-1" htmlFor="service">Part / Service</label>
            <InputText id="serviceWO" value={WO.part_service_Name} onChange={(e) => setWO({...WO, part_service_Name: e.target.value})} />
          </div>
          <div className="flex flex-column mt-2 md:mt-0 quantity">
            <label className="pb-1" htmlFor="quantity">Quantity</label>
            <InputNumber id="quantityWO" mode="decimal" prefix="x " value={WO.quantity}
              maxFractionDigits={2} onChange={(e) => setWO({...WO, quantity: e.value})} />
          </div>
          <div className=" flex flex-row priceNetWO">
            <div className="flex flex-column mt-2 md:mt-0">
              <label className="pb-1" htmlFor="priceNet">Price Net</label>
              <InputNumber id="priceNetWO" mode="currency" currency="PLN" value={WO.price_net} onChange={(e) => setWO({...WO, price_net: e.value})} />
            </div>
            <div className="flex flex-column mt-2 md:mt-0 totalNetWO">
              <label className="pb-1" htmlFor="totalNet">Total Net</label>
              <InputNumber id="totalNetWO" mode="currency" currency="PLN" value={WO.totalCost_net} disabled />
            </div>
          </div>
          <div className="flex flex-column mt-2 md:mt-0 taxWO">
            <label className="pb-1" htmlFor="tax">TAX</label>
            <InputNumber id="taxWO" suffix="%" value={WO.tax} onChange={(e) => setWO({...WO, tax: e.value})} />
          </div>
          <div className=" flex flex-row">
          <div className="flex flex-column mt-2 md:mt-0 priceGrossWO">
            <label className="pb-1" htmlFor="priceGross">Price Gross</label>
            <InputNumber id="priceGrossWO" mode="currency" currency="PLN" value={WO.price_gross} disabled />
          </div>
          <div className="flex flex-column mt-2 md:mt-0 totalGrossWO">
            <label className="pb-1" htmlFor="totalGross">Total Gross</label>
            <InputNumber id="totalGrossWO" mode="currency" currency="PLN" value={WO.totalCost_gross} disabled />
          </div>
          <div className="flex align-items-end mb-2 ml-2 mt-2 md:mt-0"><i className="pi pi-plus-circle font-bold" style={{fontSize: '1.66rem'}}
              onClick={() => addNewWO()}></i></div>
        </div>
          </div>
      </div>
    </>)
}

export default WorkOrderForm