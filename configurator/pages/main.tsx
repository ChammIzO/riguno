import React from 'react';
import { createRoot } from 'react-dom/client';
import Configurator from '../components/riguno/configurator';
import '../app/globals.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<main><h1>Le configurateur n’a pas pu s’ouvrir.</h1><p>Recharge la page. Si le problème persiste, signale-le sur GitHub.</p><a href="https://github.com/ChammIzO/riguno/issues">Signaler le problème</a></main>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><Configurator/></ErrorBoundary>);
