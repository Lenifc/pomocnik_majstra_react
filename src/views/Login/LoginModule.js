import { Card } from 'primereact/card';
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password';

import { useState } from 'react';

function LoginModule({emailLogin, loginWithGoogle}){

    const [credentials, setCredentials] = useState({
        username: '',
        pwd: ''
    })

    const title = <span>
        <div className="text-center">Sign in to Pomocnik Majstra®️</div>
    </span>;

    const footer = <span>
        <div className="flex flex-column flex-md-row justify-content-center align-items-center mt-2">
          <div className="inputs">
            <div className="flex flex-column">
              <span className="p-float-label">
                <InputText id="username" type="text" onChange={(e) => setCredentials({...credentials, username: e.target.value})} />  
                <label htmlFor="username">Email</label>
              </span>
              <span className="p-float-label mt-4">
                <Password id="pwd" onChange={(e) => setCredentials({...credentials, pwd: e.target.value})} />
                <label htmlFor="pwd">Password</label>
              </span>
            </div>
          </div>
          <div className="buttons mt-4 mt-md-0 ml-0 ml-md-3 flex flex-column justify-content-between">
            <Button label="Sign in" icon="pi pi-sign-in" onClick={() => emailLogin(credentials)} className="mb-4" />
          </div>
        </div>
        <Button icon="pi pi-google" label="Temporary G-login" onClick={() => loginWithGoogle()} className="p-button-help mt-5"/>

    </span>

    return(<>
        <Card className="flex flex-column align-items-center mt-6 mx-auto relative" style={{width:'min(94%, 500px)', height: '400px'}}
            title={title} footer={footer}>
    </Card>
    </>)
}

export default LoginModule