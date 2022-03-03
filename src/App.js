import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import 'react-pro-sidebar/dist/css/styles.css';

import SidebarMenu from './SidebarMenu/SidebarMenu'
import Dashboard from './views/Dashboard/Dashboard';
import ManageVehicles from './views/Vehicles/ManageVehicles';
import NewVehicleForm from './views/Vehicles/NewVehicleForm';
import VehicleDetails from './views/Vehicles/VehicleDetails';
import ManageClients from './views/Clients/ManageClients';
import NewClientForm from './views/Clients/NewClientForm';
import ClientDetails from './views/Clients/ClientDetails';
import ManageTasks from './views/Tasks/ManageTasks';
import NewTaskForm from './views/Tasks/NewTaskForm';
import TaskDetails from './views/Tasks/TaskDetails';
import SearchForm from './views/Search/SearchForm';
import SettingsPage from './views/SettingsPage/SettingsPage';

import firebase from 'firebase/app'
import { firebaseConfig } from './firebase/config'
import { useEffect } from 'react';
// require('firebase/auth')
require('firebase/firestore')
require('firebase/functions')

firebase.initializeApp(firebaseConfig)

firebase.firestore().settings({
merge: true, // turns off cache warnings
cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

firebase.firestore().enablePersistence() // enables offline mode

// const provider = new firebase.auth.GoogleAuthProvider()
// const auth = firebase.auth()


// function checkAuthStatus() {
//   auth.onAuthStateChanged(user => {
//     if (user) {
//       console.log(user)
//     }
//       else console.log('NOT LOGGED IN');
//   })
// }

function App() {

  useEffect(() => {
    // checkAuthStatus() 
  }, [])

  return (
  <>
    <BrowserRouter>
      <SidebarMenu Logout={() => Logout()}/>
      
      <div className="App">
        <Routes>
          <Route path="/" element={(<div>eldo</div>)} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<ManageVehicles />} />
          <Route path="/vehicles/create-new" element={<NewVehicleForm />} />
          <Route path="/vehicles/details/:vin" element={<VehicleDetails />} />
          <Route path="/clients" element={<ManageClients />} />
          <Route path="/clients/create-new" element={<NewClientForm />} />
          <Route path="/clients/details/:tel" element={<ClientDetails />} />
          <Route path="/tasks/new" element={<ManageTasks />} />
          <Route path="/tasks/inprogress" element={<ManageTasks />} />
          <Route path="/tasks/closed" element={<ManageTasks />} />
          <Route path="/tasks/create-new" element={<NewTaskForm />} />
          <Route path="/tasks/details/:taskID" element={<TaskDetails />} />
          <Route path="/search" element={<SearchForm />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>

      </div>
    </BrowserRouter>
  </>
  );
}

export function Logout(){
  console.log('Wyloguj');
}

export default App;
