import { timeSheetServices } from '../services/CrawlTimeSheetServices';

export default class TimeSheet {
    public static timeSheet(req, res, next): any {
        timeSheetServices().then();
        return res.json({
            title: 'connect data',
        });
    }
}