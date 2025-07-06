import { io } from 'socket.io-client';


const socket = io(
    import.meta.env.DEV ? 'http://localhost:5000' : '/',    //For Dev, socket connects to backend http://localhost:5000  AND for Production, socket connets to same domain '/' (since frontend is served by backend)
    {
      withCredentials: true
    }
  );
  
  export default socket;