import Event from '../model/eventModel';

export const getPaginatedEventByStatus = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const allEvent = await Event.find();

    const statuses: ('upcoming' | 'active' | 'ended')[] = ['upcoming', 'active', 'ended'];
    const paginationEventbyStatus: Record<string, any> = {};

    for (const status of statuses) {
        const eventsForStatus = allEvent.filter(e => e.eventStatus === status);
        const paginated = eventsForStatus.slice(skip, skip + limit);
        const totalCount = eventsForStatus.length;
        const totalPages = Math.ceil(totalCount / limit);

        paginationEventbyStatus[status] = {
            event: paginated,
            currentPage: page,
            totalPages,
            totalCount,
        };
    }
    return paginationEventbyStatus;
}