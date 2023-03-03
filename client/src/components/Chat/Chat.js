import React, {useState, useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import io from 'socket.io-client';

import InfoBar from '../InfoBar/InfoBar';
import Input from '../Input/Input';
import Messages from '../Messages/Messages';
import TextContainer from '../TextContainer/TextContainer';

import './Chat.css';

let socket;

const Chat = () => {

    const location = useLocation();
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [users, setUsers] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    const ENDPOINT = 'http://localhost:5000';

    useEffect(() => {
        const {name, room} = queryString.parse(location.search);
        socket = io(ENDPOINT);
        console.log(name, room);

        setName(name);
        setRoom(room);

        // Emitting "joinRoom" event to backend, passing in name and room as named arguments, as well as a callback function on error
        socket.emit('joinRoom', {name, room}, (error) => {
            if (error) {
                console.log(error);
            }
        });

    }, [ENDPOINT, location.search]);

    useEffect(() => {
        socket.on('message', (message) => {
            setMessages([...messages, message]);
            console.log(message);
            console.log(messages);
        });

        socket.on('roomData', ({users}) => {
            setUsers(users);
        });
    }, [messages]);

    const sendMessage = (event) => {
        event.preventDefault();
    
        if (message) {
          socket.emit('sendMessage', message, () => setMessage(''));
        }
      }

    return (
        <div className='outerContainer'>
             <TextContainer users={users}/>
            <div className='container'>
                <InfoBar room={room}/>
                <Messages messages={messages} name={name}/>
                <Input message={message} setMessage={setMessage} sendMessage={sendMessage}/>
            </div>
        </div>
    );
};

export default Chat;
