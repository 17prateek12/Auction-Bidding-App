export const convertToIST = (date: Date): Date => {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    return new Date(date.getTime() + IST_OFFSET);
};