import './RelocateTicketsDialog.css'

import { RadioButton } from 'primereact/radiobutton'
import { Divider } from 'primereact/divider'
import { Button } from 'primereact/button'

import { useState } from 'react'

function RelocateTicketDialog({submit, abort, message}) {

    const [newLocation, setNewLocation] = useState('')

    return (
    <div className="modal-mask">
      <div className="modal-wrapper">
        <div className="modal-container text-center">

          <h2 className="modal-header">
              { message }
          </h2>
          <Divider />

          <div className="modal-body text-justify ml-6 pl-5 flex flex-column">
            <span>
              <RadioButton id="new" value="wolne" checked={ newLocation === 'wolne'} onChange={(e) => setNewLocation(e.value)} />
              <label htmlFor="new"> New</label>
            </span>

            <span className="mt-2">
              <RadioButton id="inprogress" value="obecne" checked={newLocation === 'obecne'} onChange={(e) => setNewLocation(e.value)} />
              <label htmlFor="inprogress"> InProgress</label>
            </span>

            <span className="mt-2">
              <RadioButton id="done" value="zakonczone" checked={newLocation === 'zakonczone'} onChange={(e) => setNewLocation(e.value)} />
              <label htmlFor="done"> Closed</label>
            </span>
          </div>
          <Divider />

          <div className="modal-footer mt-2">
              { newLocation.length > 0 && <Button className="p-button-success" onClick={() => submit(true, newLocation)}
                label="Relocate" />}
              <Button className=" p-button-danger" onClick={() => abort()} label="Cancel" />
          </div>
        </div>
      </div>
    </div>)
}

export default RelocateTicketDialog