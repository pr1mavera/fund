import fetch from 'node-fetch';
import cliProgress from 'cli-progress';
import { existsSync, mkdirpSync } from 'fs-extra';
import { dirname, join } from 'path';
import moment from 'moment';
import { writeFileSync } from 'fs';

export const headers = {
	"accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "cookie": "qgqp_b_id=fd0711884b2bc6e4541063158eaa3d49; st_si=94893829972830; st_asi=delete; FundWebTradeUserInfo=JTdCJTIyQ3VzdG9tZXJObyUyMjolMjIlMjIsJTIyQ3VzdG9tZXJOYW1lJTIyOiUyMiUyMiwlMjJWaXBMZXZlbCUyMjolMjIlMjIsJTIyTFRva2VuJTIyOiUyMiUyMiwlMjJJc1Zpc2l0b3IlMjI6JTIyJTIyLCUyMlJpc2slMjI6JTIyJTIyJTdE; ASP.NET_SessionId=pg10oxjnahxjgoirc4inolj2; _adsame_fullscreen_16928=1; st_pvi=29837354844280; st_sp=2022-01-03%2017%3A35%3A15; st_inirUrl=https%3A%2F%2Ffund.eastmoney.com%2F; st_sn=7; st_psi=20220108155154122-112200304021-7308268115",
    "Referer": "http://fund.eastmoney.com/manager/default.html",
    "Referrer-Policy": "strict-origin-when-cross-origin"
};

const progressMultiBar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: 'progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
}, cliProgress.Presets.shades_grey);

export interface FundManager {
	id: number;
	name: string;
	companyId: number;
	fundList: number[];
	workingTime: number;
}

export async function requestFundManager(): Promise<FundManager[]> {
    let requestProgress: cliProgress.SingleBar | undefined;
    async function requestFundManagerInner(task: FundManager[] = [], curPage = 1): Promise<FundManager[]> {
        const response = await fetch(`http://fund.eastmoney.com/Data/FundDataPortfolio_Interface.aspx?dt=14&mc=returnjson&ft=all&pi=${curPage}&sc=abbname&st=asc`, { headers });
        const originData = await response.text();
        const fixedData = originData.replace('var returnjson= ', '').replace(/data|record|pages|curpage/g, x => `"${x}"`);
        const { data, record, pages } = JSON.parse(fixedData) as {
            data: string[][];
            record: number;
            pages: number;
        };
        if (!requestProgress) {
            requestProgress = progressMultiBar.create(record, 0);
        }
        const managerList = [
            ...task,
            ...data.map(([id, name, companyId, _, fundList, __, workingTime]) => ({
                id: Number(id),
                name,
                companyId: Number(companyId),
                fundList: fundList.split(',').map(fundId => Number(fundId)),
                workingTime: Number(workingTime),
            })),
        ];
        if (curPage != pages) {
            requestProgress.update(managerList.length);
            return requestFundManagerInner(managerList, ++curPage);
        }
        requestProgress.stop();
        progressMultiBar.remove(requestProgress);
        return managerList;
    }
    return requestFundManagerInner();
}

(async () => {
    const data = await requestFundManager();
    const time = moment().format('YYYY_MM_DD_HH_mm_ss');
    const target = join(process.cwd(), './.storage', `./${time}`, './fund-manager.json');
    const targetDir = dirname(target);
    if (!existsSync(targetDir)) {
        mkdirpSync(targetDir);
    }
    writeFileSync(target, JSON.stringify(data, null, 2));
    console.log(data);
})();
