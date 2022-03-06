import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'

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
import WorkshopDetails from './views/SettingsPage/WorkshopDetails';
import LoginModule from './views/Login/LoginModule';

import { Toast } from 'primereact/toast';

import firebase from 'firebase/app'
import { firebaseConfig } from './firebase/config'
import { useEffect, useRef, useState } from 'react';
require('firebase/auth')
require('firebase/firestore')
require('firebase/functions')

firebase.initializeApp(firebaseConfig)

firebase.firestore().settings({
merge: true, // turns off cache warnings
cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

firebase.firestore().enablePersistence() // enables offline mode

const provider = new firebase.auth.GoogleAuthProvider() // provide quick login with Google Account
const auth = firebase.auth()



function App() {

  const toast = useRef()
  const [userLoggedIn, setUserLoggedIn] = useState()
  const [collapsed, setCollapsed] = useState(localStorage.getItem('menuStatus') ? JSON.parse(localStorage.getItem('menuStatus')) : false)

  useEffect(() =>{
    setCollapsed(JSON.parse(localStorage.getItem('menuStatus')))
  }, [localStorage.getItem('menuStatus')])

  function checkAuthStatus() {
    auth.onAuthStateChanged(user => {
      user ? setUserLoggedIn(user) : setUserLoggedIn(false)
    })
  }

  function loginWithGoogle(){
    auth.signInWithPopup(provider).then(() => {
        checkAuthStatus()
        // const provideData = auth.currentUser.providerData
        // console.log(provideData);
        toast.current.show({severity:'success', summary: 'Sign in', detail:`User signed in!`, life: 2500})

        // callLogs({provideData})
      }).catch((error) => {
      toast.add({severity:'error', detail: error.message, life: 8000})
    })
  }

  const emailLogin = (credentials) => {
    const {username, pwd } = credentials
    if(username && pwd){
      firebase.auth().signInWithEmailAndPassword(username, pwd).then(() => {
          toast.current.clear()
          toast.current.show({severity:'success', summary: 'Sign in', detail:`User signed in!`, life: 2500})
          // const provideData = auth.currentUser.providerData
          // console.log(provideData);
          // callLogs({provideData})
        })
        .catch(error =>{
          toast.current.clear()
          const errorCode = error.code
          const errorMessage = error.message

          toast.current.show({severity:'error', summary: errorCode, detail: errorMessage, life: 8000})
        })
    } 
  }

  function logOutFromAccount() {
    auth.signOut().then(() => {
      checkAuthStatus()
      toast.current.show({severity:'info', summary: 'Sign out', detail:`User signed out!`, life: 2500})
      // down below are functions that clear all the saved data in local memory
      firebase.firestore().terminate()
      localStorage.clear()
      indexedDB.deleteDatabase('firebaseLocalStorageDb')
      indexedDB.deleteDatabase('firestore/[DEFAULT]/baza-mech/main/')
      //
    }).then(() => {
      firebase.firestore().clearPersistence()
    })
      .catch((error) => {
        toast.current.show({severity:'error', summary: error, detail:error?.message, life: 2500})
    })
  }

  useEffect(() => {
    checkAuthStatus() 
  }, [])

  return (
  <>
    <Toast ref={toast}></Toast>
    <BrowserRouter>
    {userLoggedIn === false && <>
      <LoginModule loginWithGoogle={loginWithGoogle} 
                 emailLogin={(credentials) => emailLogin(credentials)} />
      <Navigate to="/" />
    </>}
    {userLoggedIn && <>
      <SidebarMenu Logout={() => logOutFromAccount()} isMenuCollapsed={(newVal) => setCollapsed(newVal)}/>
        
        <div className="App" style={{paddingLeft: collapsed ? '80px' : '250px'}}>
          <Routes>
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
            <Route path="/search/*" element={<SearchForm />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/workshop/details" element={<WorkshopDetails />} />
            
            <Route path="/*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </>}
    </BrowserRouter>
  </>
  )
}

export default App;
