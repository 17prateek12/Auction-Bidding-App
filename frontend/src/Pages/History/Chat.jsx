import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { chatWithEvent } from '../../Api/Event/event';

function Chat() {
  const location = useLocation();
  const event = location.state?.event;

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!event) {
    return <div>No event data available</div>;
  }

  const handleSendQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await chatWithEvent(event._id, question);
      setChatHistory((prev) => [
        ...prev,
        { question, response: result.response },
      ]);
      setQuestion('');
    } catch (err) {
      setError(err.message || 'Failed to fetch response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-6">
      <h1 className="text-3xl font-bold mt-[-40px]">Chat for Event</h1>
      <p className="text-gray-400">Event Name: {event.eventName}</p>
      {/* <p className="text-gray-400">Event ID: {event._id}</p>
      <p className="text-gray-400">
        Date: {new Date(event.eventDate).toLocaleDateString()}
      </p> */}
      <p className="text-gray-400">
        Time: {new Date(event.startTime).toLocaleTimeString()} -{' '}
        {new Date(event.endTime).toLocaleTimeString()}
      </p>

      <div className="mt-6  overflow-y-auto bg-gray-800 p-4 rounded">
      <div className="mt-6 h-96 overflow-y-auto bg-gray-800 p-4 rounded">
  {chatHistory.map((chat, index) => (
    <div key={index} className="mb-4">
      {/* User Question */}
      <div className="text-right">
        <p className="text-gray-300 bg-blue-700 p-2 rounded-lg inline-block max-w-xs">
          {chat.question}
        </p>
      </div>

      <div className="text-left mt-2">
        <p className="text-gray-300 bg-gray-700 p-2 rounded-lg inline-block max-w-xs">
          {chat.response}
        </p>
      </div>
    </div>
  ))}
</div>
      <div className="mt-4 flex items-center">
        <textarea
          className="w-full bg-transparent px-2  rounded-xl border border-gray-300 h-[40px] pt-1"
          rows="4"
          placeholder="Ask a question about the event..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        ></textarea>
        <button
          className=" ml-2 px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-500"
          onClick={handleSendQuestion}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Send'}
        </button>
      </div>
      </div>

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}

export default Chat;