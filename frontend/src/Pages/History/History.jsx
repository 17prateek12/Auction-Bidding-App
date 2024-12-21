import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents } from '../../Api/Event/event';
function History() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAllEvents();
        setEvents(data.events);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);
  const handleChatRedirect = (event) => {
    navigate('/home/chat', { state: { event } });
  };
  if (loading) return <div className="text-white text-center mt-6">Loading events...</div>;
  if (error) return <div className="text-red-500 text-center mt-6">Error: {error}</div>;
  return (
    <div className="min-h-screen  text-white p-6">
      <h1 className="text-3xl   text-black font-bold mb-8 text-center">Event History</h1>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300"
              key={event._id}
            >
              <h2 className="text-xl font-semibold mb-4">{event.eventName}</h2>
              <p className="text-gray-400">
                Date: {new Date(event.eventDate).toLocaleDateString()}
              </p>
              <p className="text-gray-400">
                Time: {new Date(event.startTime).toLocaleTimeString()} -{' '}
                {new Date(event.endTime).toLocaleTimeString()}
              </p>
              <p className="text-gray-400 mt-2">{event.description}</p>
              <button
                className="px-4 rounded bg-gray-700 my-2 hover:bg-gray-500"
                onClick={() => handleChatRedirect(event)}
              >
                Chat
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">No events found</div>
      )}
    </div>
  );
}
export default History;