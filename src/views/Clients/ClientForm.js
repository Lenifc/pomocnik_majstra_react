import { getTime } from '../../components/getCurrentTime'
import { updateClientNumber } from '../../components/EditMoveDeleteOptions'
import validPhoneNum from '../../components/validPhoneNum'

import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useContext } from 'react'
import { toast } from 'react-toastify';

import ContextStore from '../../store/ContextStore'

import firebase from 'firebase/app'

import { Editor } from 'primereact/editor'
import { RadioButton } from 'primereact/radiobutton'
import { InputMask } from 'primereact/inputmask'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'


function ClientForm(){

	const clients = firebase.firestore()
					.collection('warsztat')
					.doc('Klienci')

    const { pathname } = useLocation()
    const navigate = useNavigate()

	const { activeClient, getClientData } = useContext(ContextStore)	
    const clearForm = useState({
		phoneNum: '',
		phoneNum2: '',
		name: '',
		address: '',
		description: '',
		typeOfClient: 'individual',
		companyId: '',
		postCode: '',
		city: '',
    })
	const clientTypes = [{name: 'Individual', key: 'individual'}, {name: 'Company / Self-employed', key:'company'}]
	const [clientForm, setClientForm] = useState(clearForm[0])

	useEffect(() => {
		if(pathname.indexOf('edit') <= 0) setClientForm(clearForm[0])
		else {
			(Object.keys(activeClient).length && pathname.indexOf('edit') > 0) ? autoFillData() : navigate('/clients/create-new')
		}
	}, [])

	// cleanup on unmount
    useEffect(() => {
		return () => getClientData({})
	},[]) 
	
	
	function autoFillData() {
		// rename/convert polish naming of parameters from FirebaseStore to english naming convention used in this React App
		setClientForm({
			...clientForm,
			phoneNum: activeClient['Tel'] || '',
			phoneNum2: activeClient['Tel2'] || '',
			name: activeClient['Imie'] || '',
			typeOfClient: activeClient['Rodzaj'] === 'Firma' ? 'company' : 'individual',
			companyId: activeClient['Rodzaj'] === 'Firma' ? activeClient['NIP'] : '',
			address: activeClient['Ulica'] || '',
			postCode: activeClient['KodPocztowy'] || '',
			city: activeClient['Miejscowosc'] || '',
			description: activeClient['Opis'] || '',
		})
	}
	
    function validateData(){
		document.querySelectorAll('.p-invalid').forEach(input => input?.classList?.remove('p-invalid'))
		
		if(!clientForm.phoneNum || !validPhoneNum(clientForm.phoneNum)) document.querySelector('#phoneNum').classList.add('p-invalid')
		if(clientForm.typeOfClient === 'company' && (!clientForm.companyId || clientForm.companyId?.length < 10)) document.querySelector('#taxNumber').classList.add('p-invalid')
		if (!clientForm.name || clientForm.name?.length < 2) document.querySelector('#clientName').classList.add('p-invalid')
		let checkForInvalids = document.querySelectorAll('.p-invalid')
		
		if(checkForInvalids.length === 0) prepareData()
		else toast.error('Fill the inputs with vaild data!')
	}
	
	async function prepareData(){
		let currentTime = getTime()
		let ID = Date.now()
		
			// convert to polish naming used in Firestore
		let preparedData = {
				id: ID,

				Tel: validPhoneNum(clientForm.phoneNum),
				Tel2: clientForm.phoneNum2 || "",
				Imie: clientForm.name,
				Rodzaj: clientForm.typeOfClient === 'company' ? 'Firma' : 'Prywatny',
				NIP: clientForm.typeOfClient === 'company' ? clientForm.companyId : "",
				KodPocztowy: clientForm.postCode || "",
				Miejscowosc: clientForm.city || "",
				Ulica: clientForm.address || "",

				Opis: clientForm.description || "",
				Ostatnia_Aktualizacja: currentTime,
		}

		if(pathname.indexOf('edit') > 0){
			if(validPhoneNum(activeClient['Tel']) !== validPhoneNum(clientForm.phoneNum)) {
				// updateClientNumber(OLD_DATA, NEW_DATA)
				let confirmUpdate = await updateClientNumber(activeClient, preparedData)
				if(confirmUpdate !== false) navigate('/clients')
			} else sendDataToFirebase(preparedData)
		} else sendDataToFirebase(preparedData)
	}


	async function sendDataToFirebase(preparedData) {
		const { Tel: phoneNum }  = preparedData

		const collectionReference = clients.collection("Numery")
		const docReference = collectionReference.doc(phoneNum)

		try{
			const getDoc = await docReference.get()
			await addOrUpdateClient(getDoc)
		} catch (err) {
			toast.error(`${err.code}: ${err.message}`, { autoClose: 8000 })
		}
	
		
		async function addOrUpdateClient(doc) {
			try{
				const ifNotExist = await checkForClient(doc)
				if(ifNotExist) updateAndCleanup()
			}
			catch(err){
				toast.error(`${err.message}`)
			}
		}

		async function checkForClient(doc){
			if (doc.exists) {
			if(pathname.indexOf('edit') <= 0) {
				toast.error('This contact number is already assign to existing client!')
				return false
			}
			else {
				await docReference.update({...preparedData})
					toast.dismiss()
					toast.success(`Client ${phoneNum} has been updated!`)
				}
			} else {
				await docReference.set({...preparedData})
				toast.dismiss()
				toast.success(`New client has been created: ${phoneNum}`)
			}
			return true
		}
	}	

		function updateAndCleanup(){
			if(pathname.indexOf('edit') <= 0) clients.update("Klienci", firebase.firestore.FieldValue.increment(1))
			resetForm()
			navigate('/clients')  
		}
	


    function resetForm(){
		setClientForm(clearForm[0])
	}


    const cardTitle = <>
      <div style={{position: 'absolute', top: '0px', right: '10px', fontSize: '2.2rem', cursor: 'pointer'}} onClick={() => navigate('/clients')}>&times;</div>
      <div className="text-center">{ pathname.indexOf('edit') > 0 ? "Edit Client's Data" : 'Create New Client' }</div>
    </>

    const cardFooter = 
		<div className="flex flex-column md:flex-row justify-content-center">
      <Button label={pathname.indexOf('edit') > 0 ? "Update Client's Data" : 'Create Client'}
        className="p-button-success p-button-outlined m-2 font-bold" onClick={() => validateData()}
        icon="fas fa-save" />
      <Button label="Reset Form" className="p-button-danger p-button-outlined m-2 font-bold" onClick={() => resetForm()}
        icon="fas fa-trash-alt" />
    </div>

    const editorHeader = 
		<span className="ql-formats">
      <button className="ql-bold"></button>
      <button className="ql-italic"></button>
      <button className="ql-underline"></button>
      <button className="ql-list" value="bullet"></button>
      <button className="ql-link"></button>
  	</span>


    return(
<div className="pt-4">
  <Card className="relative" style={{maxWidth: '800px', margin: '0 auto'}} 
        title={cardTitle} footer={cardFooter}>
      <form>
        <div className="flex md:flex-row flex-column md:justify-content-evenly align-items-center">
          <div className="flex flex-column ">
            <h3 className="mt-3">Required: </h3>

            <span className="p-float-label mt-4">
              <InputText type="text" id="phoneNum" required value={clientForm.phoneNum} onChange={(e) => setClientForm({...clientForm, phoneNum: e.target.value})} />
              <label htmlFor="phoneNum">Phone number*</label>
            </span>


            <div className="flex flex-row mt-3">
            {clientTypes.map(type => 
              <div className="field-radiobutton" key={type.key}>
                <RadioButton name="typeOfClient" id={type.key} value={type.key} checked={ type.key === clientForm.typeOfClient} 
                             onChange={e => setClientForm({...clientForm, typeOfClient: e.value})} className="ml-2" />
                <label htmlFor="typeOfClient">{type.name}</label>
              </div>
            )}
            </div>

            {clientForm.typeOfClient === 'individual' && 
              <span className="p-float-label mt-3">
                <InputText type="text" id="clientName" value={clientForm.name} onChange={(e) => setClientForm({...clientForm, name: e.target.value})} />
                <label htmlFor="clientName">Client Name*</label>
              </span>
						}
            {clientForm.typeOfClient === 'company' && 
              <div className="flex flex-column sm:flex-row mt-3">
                <span className="p-float-label">
                  <InputText type="text" id="clientName" value={clientForm.name} onChange={(e) => setClientForm({...clientForm, name: e.target.value})} />
                  <label htmlFor="clientName">Company name*</label>
                </span>
                <span className="p-float-label mt-4 sm:mt-0 ml-0 sm:ml-2">
                  <InputMask mask="9999999999" id="taxNumber" value={clientForm.companyId} onChange={(e) => setClientForm({...clientForm, companyId: e.target.value})} style={{width:'125px'}} />
                  <label htmlFor="taxNumber">Tax Number*</label>
                </span>
              </div>
						}
          </div>

          <div className="flex flex-column justify-content-evenly align-items-center sm:align-items-start">
            <h3 className="mt-3">Extra: </h3>
            <span className="p-float-label mt-4">  
              <InputText type="text" id="phoneNum2" value={clientForm.phoneNum2} onChange={(e) => setClientForm({...clientForm, phoneNum2: e.target.value})} />
              <label htmlFor="phoneNum2">Another phone number</label>
            </span>
            <h4 className="mt-2">Address</h4>
            <div className="flex flex-column sm:flex-row">
              <span className="p-float-label mt-4">
                <InputMask mask="99-999" id="postCode" value={clientForm.postCode} onChange={(e) => setClientForm({...clientForm, postCode: e.target.value})} style={{width:'120px'}} />
                <label htmlFor="postCode">Post Code</label>
              </span>
              <span className="p-float-label mt-4 ml-0 sm:ml-2">
                <InputText type="text" id="city" value={clientForm.city} onChange={(e) => setClientForm({...clientForm, city: e.target.value})} />
                <label htmlFor="city">City</label>
              </span>
            </div>
            <span className="p-float-label mt-4">
              <InputText type="text" id="address" value={clientForm.address} onChange={(e) => setClientForm({...clientForm, address: e.target.value})} />
              <label htmlFor="address">Street and number</label>
            </span>

          </div>
        </div>
        <label htmlFor="textArea">
          <h3 className="mt-3 mb-1 text-center">Additional informations:</h3>
        </label>
        <Editor id="textArea" className="mx-auto mt-2 mb-5" headerTemplate={editorHeader} style={{height: '200px'}}
								value={clientForm.description} onTextChange={(e) => setClientForm({...clientForm, description: e.htmlValue})}>
        </Editor>
      </form>
  </Card>
</div>)
}

export default ClientForm