import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ContextStore from '../../store/ContextStore'
import { DeleteFunc } from '../../components/EditMoveDeleteOptions'

import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'

import firebase from 'firebase/app'

function ClientDetails(){
	const clientPath = firebase.firestore().collection('warsztat').doc('Klienci').collection('Numery')

    const { activeClient } = useContext(ContextStore)
    const { Tel, Tel2, Imie, NIP, KodPocztowy, Miejscowosc, Ulica, Opis, Rodzaj, id } = activeClient
	const [countCars, setCountCars] = useState()
    const navigate = useNavigate()

			// check if user tries to open details through link address
    useEffect(() => {
        if(!activeClient.length && !activeClient.Tel) navigate(-1)
		else countVehicles()
    },[])

	async function countVehicles(){
        const vehiclesPath = firebase.firestore().collection('warsztat').doc('Pojazdy').collection('VIN').where('Tel', '==', activeClient.Tel)

        let getTotal = (await vehiclesPath.get()).size
        setCountCars(getTotal)
    }


	function confirmDeleteModal(){
		confirmDialog({
			message: `Are you sure you want to delete client ${activeClient.Tel}?`,
			header: 'Confirmation',
			icon: 'pi pi-exclamation-triangle',
			acceptClassName: 'p-button-success',
          	rejectClassName: 'p-button-danger',
			accept: () => {
				let confirm = DeleteFunc('Client', clientPath , Tel)
				if(confirm !== false) navigate(-1)
			},
			reject: () => {}
		});
	}


	const title = <>
		<div style={{position: 'absolute', top: '0px', right: '10px', fontSize: '2.2rem', cursor: 'pointer'}} onClick={() => navigate(-1)}>&times;</div>
		<div className="text-center">Details of { Imie }</div>
	</>   

	const footer = <>
		<div className="flex flex-column sm:flex-row justify-content-center">
			<Button label="Edit Client Data" onClick={() => navigate(`/clients/details/${Tel}/edit`)} icon="pi pi-pencil" />
			<Button label="Delete Client Data" className="p-button-danger mx-0 sm:mx-3 my-3 sm:my-0" icon="pi pi-trash" onClick={() => confirmDeleteModal(activeClient)}/>
			<Button label="Assign vehicle" className="p-button-success" icon="pi pi-car" onClick={() => navigate('/vehicles')}/>
		</div>
	</>

    return(
    <div className="pt-5">
			<Card style={{maxWidth:'600px', margin: '0 auto'}} className="relative" title={title} footer={footer}>
				<div className="font-bold my-2 pl-3">id: {id}</div>
				<div className="my-1 pl-3">Contact: { `${Tel} ${Tel2 ? ' ; ' + Tel2 : ''}` }</div>
				<div className="my-1 pl-3">Customer type: { Rodzaj === 'Firma' ? 'Company / Self-employment' : 'Individual Customer' }</div>
				{Rodzaj === 'Firma' && <div className="my-1 pl-3" >NIP: { NIP }</div>}
				{KodPocztowy && Miejscowosc && Ulica && <div className="my-1 pl-3">{ `${KodPocztowy} ${Miejscowosc} - ${Ulica} street` }</div>}
				<div className="my-1 pl-3">Number of assigned vehicles: { countCars ?? (<i className='pi pi-spin pi-spinner' />) }</div>
				{ Opis && (<>
					<div className="mt-4 mb-1 pl-3">Additional informations:</div>
					<div className="my-1 pl-5" dangerouslySetInnerHTML={{__html: Opis}}></div>
				</>)}
    	</Card>
    </div>
	)
}

export default ClientDetails