import SearchResults from './SearchResults'

import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'

import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'

import firebase from 'firebase/app'
import validPhoneNum from '../../components/validPhoneNum.js'
import validateVIN from '../../components/validateVIN.js'

import { useContext } from 'react'
import ContextStore from '../../store/ContextStore'

function SearchForm(){

    const [searchNumber, setSearchNumber] = useState('')
    const [searchVIN, setSearchVIN] = useState('')
    const [outputClient, setOutputClient] = useState('')
    const [outputVehicles, setOutputVehicles] = useState('')

    const { activeSearchResults, getActiveSearchResults} = useContext(ContextStore)


    function validSearchData(target) {

        let buttons = document.querySelectorAll('.searchBtn')
        let vinBtn = document.querySelector('.vinBtn')
        let phoneBtn = document.querySelector('.phoneBtn')
      
        buttons.forEach(btn => btn.classList.remove('active'))
        try{
            if (target === 'PhoneNumber' && searchNumber.trim()) {
                let legitPhoneNum = validPhoneNum(searchNumber.trim())
                if (legitPhoneNum) {
                  phoneBtn.classList.add('active')
                  searchInFirestore(legitPhoneNum, 'phoneNum')
                }
                else throw Error('Phone number format is invalid')
            }
            if (target === 'VIN' && searchVIN.trim()) {
                let VINNumber = validateVIN(searchVIN)
                if (VINNumber) {
                    vinBtn.classList.add('active')
                    searchInFirestore(VINNumber, 'VIN')
                } 
                else throw Error('Check VIN format')
            }
        } 
        catch(err){
            toast.warn('Invalid input - ' + err.message)
        }
    }
      

    function searchInFirestore(searchData, searchOption) {
        setOutputVehicles('')
        setOutputClient('')
      
        if (searchOption === 'VIN') searchForVehicles(searchData)
        if (searchOption === 'phoneNum') searchForClient(searchData)
    }
    

    async function searchForClient(data, order){
        const clients = firebase.firestore()
                                .collection('warsztat')
                                .doc('Klienci').collection("Numery").doc(data)
      
        const response = (await clients.get()).data()
      
        if(response) {
            setOutputClient(response)
            getActiveSearchResults([response, outputVehicles])
      
            if(order !== 2) await searchForVehicles(response.Tel, 2)
        }
        else {
            if(order !== 2) toast.warn(`Cannot find client with provided phone number.`)
        }
    }
      
      
    async function searchForVehicles(data, order){
        let vehicle

        try{
            if(order && order === 2) vehicle = firebase.firestore()
                                                .collection('warsztat')
                                                .doc('Pojazdy').collection("VIN").where('Tel', '==', data) 
            else vehicle = firebase.firestore()
                                    .collection('warsztat')
                                    .doc('Pojazdy').collection("VIN").doc(data)
          
            let response      
            order && order === 2 ? response = await vehicle.get() : response = (await vehicle.get()).data()
          
            if(response){
                order && order === 2 ? response = response.docs?.map(doc => doc.data()) : response = [response]
          
                setOutputVehicles(response)
                getActiveSearchResults([outputClient, response])
          
                if(response?.[0]?.Tel) await searchForClient(response[0].Tel, 2)
            }
            else if(!order) throw Error(`Cannot find vehicle with provided VIN.`)
        } catch(err){
            toast.warn(err.message)
        }
    }
      
    useEffect(() =>{
        if(activeSearchResults) {
            setOutputClient(activeSearchResults[0])
            setOutputVehicles(activeSearchResults[1])
        }
    }, [])


    const cardVehicleTitle = 'Search for vehicle by VIN'
    const cardVehicleFooter = <Button onClick={() => validSearchData('VIN')} icon="pi pi-search" className="p-button-primary searchBtn vinBtn" 
                                        label="Search" id="vin" />

    const cardClientTitle = 'Search for client by phone number'
    const cardClientFooter = <Button onClick={() => validSearchData('PhoneNumber')} icon="pi pi-search" className="p-button-primary searchBtn phoneBtn" 
                                        label="Search"/>

    return(
        <div>
        <div className="flex flex-column md:flex-row justify-content-center pt-5 text-center">
          <Card className="mx-0 md:mx-3 my-3 md:my-0" title={cardVehicleTitle} footer={cardVehicleFooter}>
              <label htmlFor="searchByVIN"></label>
              <InputText name="searchClient" id="searchByVIN" value={searchVIN} onChange={(e) => setSearchVIN(e.target.value)} maxLength="17" style={{width: 'min(100%, 200px)'}}
                tooltip="Valid VIN length is 17-digits" />
          </Card>
          <Card className="mx-0 md:mx-3 my-3 md:my-0" title={cardClientTitle} footer={cardClientFooter}>
              <label htmlFor="searchByPhoneNum"></label>
              <InputText name="searchClient" id="searchByPhoneNum" value={searchNumber} onChange={(e) => setSearchNumber(e.target.value)} style={{width: 'min(100%, 200px)'}}
                tooltip="7-digits for landline ; 9-digits for mobile" label="Search for client"/>
          </Card>
        </div>
      { (outputClient?.length > 0 || outputVehicles?.length > 0) && <SearchResults outputVehicles={outputVehicles} outputClient={outputClient} className="pt-5"/>}
      
      </div>)
}

export default SearchForm