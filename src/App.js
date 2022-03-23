import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import  { ContextProvider } from './store/ContextStore'

import 'react-pro-sidebar/dist/css/styles.css';

import SidebarMenu from './SidebarMenu/SidebarMenu'
import Dashboard from './views/Dashboard/Dashboard';
import ManageVehicles from './views/Vehicles/ManageVehicles';
import VehicleForm from './views/Vehicles/VehicleForm';
import VehicleDetails from './views/Vehicles/VehicleDetails';
import ManageClients from './views/Clients/ManageClients';
import ClientForm from './views/Clients/ClientForm';
import ClientDetails from './views/Clients/ClientDetails';
import ManageTasks from './views/Tasks/ManageTasks';
import NewTaskForm from './views/Tasks/NewTaskForm';
import TaskDetails from './views/Tasks/TaskDetails';
import SearchForm from './views/Search/SearchForm';
import SettingsPage from './views/SettingsPage/SettingsPage';
import WorkshopDetails from './views/SettingsPage/WorkshopDetails';
import LoginModule from './views/Login/LoginModule';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import firebase from 'firebase/app'
import { firebaseConfig } from './firebase/config'
import { useEffect, useState } from 'react';
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

  const [userLoggedIn, setUserLoggedIn] = useState()
  const [pageLoading, setPageLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(localStorage.getItem('menuStatus') ? JSON.parse(localStorage.getItem('menuStatus')) : false)

  useEffect(() =>{
    setCollapsed(JSON.parse(localStorage.getItem('menuStatus')))
  }, [localStorage.getItem('menuStatus')])

  useEffect(() => {
    if(userLoggedIn !== undefined) setPageLoading(Boolean(false))
  }, [userLoggedIn])

  useEffect(() => {
    checkAuthStatus() 
  }, [])


  function checkAuthStatus() {
      auth.onAuthStateChanged(user => {
      user ? setUserLoggedIn(user) : setUserLoggedIn('')
    })
  }

  function loginWithGoogle(){
    auth.signInWithPopup(provider).then(() => {
        checkAuthStatus()
        const provideData = auth.currentUser.providerData[0]

        toast.dismiss()
        toast.success(`User signed in. Hello, ${provideData.displayName || provideData.email}`)
      }).catch((error) => {
      console.error(error)
      toast.error(`${error.message}`)
    })
  }

  const emailLogin = (credentials) => {
    const {username, pwd } = credentials
    if(username && pwd){
      firebase.auth().signInWithEmailAndPassword(username, pwd).then(() => {
          const provideData = auth.currentUser.providerData[0]

          toast.dismiss()
          toast.success(`User signed in. Hello, ${provideData.displayName || provideData.email}`)
        })
        .catch(error =>{
          toast.dismiss()
          toast.error(`${error.code}: ${error.message}`)
        })
    } 
  }

  function logOutFromAccount() {
    auth.signOut().then(() => {
      checkAuthStatus()
      toast.dismiss()
      toast.info('User signed out!')
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
        toast.error(`${error}: ${error.message}`)
    })
  }

  return (
  <ContextProvider>
   <ToastContainer
    // default parameters for toast notifications
        position="top-right"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
    />

    <BrowserRouter>
    {!userLoggedIn && !pageLoading && <>
        <LoginModule  loginWithGoogle={loginWithGoogle} 
          emailLogin={(credentials) => emailLogin(credentials)} />
      {/* <Navigate to="/" replace />   */}
      {/* Got an infinite loop error (?) while trying to redirect to main path when not logged - check how to fix it  */}
    </>}
    {userLoggedIn && !pageLoading && <>
      <SidebarMenu Logout={() => logOutFromAccount()} isMenuCollapsed={(newVal) => setCollapsed(newVal)}/>
        
        <div className="App" style={{paddingLeft: collapsed ? '80px' : '250px'}}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<ManageVehicles />} />
            <Route path="/vehicles/create-new" element={<VehicleForm />} />
            <Route path="/vehicles/details/:vin" element={<VehicleDetails />} />
            <Route path="/vehicles/details/:vin/edit" element={<VehicleForm />} />
            <Route path="/clients" element={<ManageClients />} />
            <Route path="/clients/create-new" element={<ClientForm />} />
            <Route path="/clients/details/:tel" element={<ClientDetails />} />
            <Route path="/clients/details/:tel/edit" element={<ClientForm />} />
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
  </ContextProvider>
  )
}

export default App;
