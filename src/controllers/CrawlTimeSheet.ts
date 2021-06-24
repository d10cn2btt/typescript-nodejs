import { timeSheet } from '../services/CrawlTimeSheetServices';

export default class TimeSheet {
    public static timeSheet(req, res, next): any {
        timeSheet().then();
        return res.json({
            title: 'connect data',
        });
    }
}