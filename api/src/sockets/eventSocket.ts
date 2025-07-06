import { ApiError } from '../utils/ApiError';
import { getPaginatedEventByStatus } from '../utils/fetchPaginatedEvent';

export const eventSockethandler = (socket: any) => {
    socket.on('event:fetch', async ({ page = 1, limit = 10 }) => {
        try {
            if (page < 1 || limit < 10) {
                throw new ApiError(400, 'page and limit must be positive number');
            }

            const data = await getPaginatedEventByStatus(page, limit);

            socket.emit('event:response', {
                message: 'Event fetched successfully (real-time)',
                event: data,
            });

        } catch (err: any) {
            if (err instanceof ApiError) {
                socket.emit('events:error', {
                    status: err.statusCode,
                    message: err.message,
                });
            } else {
                console.error('Unexpected socket error', err);
                socket.emit('events:error', {
                    status: 500,
                    message: 'Something went wrong while fetching event'
                });
            }
        }
    })
}