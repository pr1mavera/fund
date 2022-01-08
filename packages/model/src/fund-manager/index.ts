import fetch from 'node-fetch';

export const headers = {
	"accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "cookie": "qgqp_b_id=fd0711884b2bc6e4541063158eaa3d49; st_si=94893829972830; st_asi=delete; FundWebTradeUserInfo=JTdCJTIyQ3VzdG9tZXJObyUyMjolMjIlMjIsJTIyQ3VzdG9tZXJOYW1lJTIyOiUyMiUyMiwlMjJWaXBMZXZlbCUyMjolMjIlMjIsJTIyTFRva2VuJTIyOiUyMiUyMiwlMjJJc1Zpc2l0b3IlMjI6JTIyJTIyLCUyMlJpc2slMjI6JTIyJTIyJTdE; ASP.NET_SessionId=pg10oxjnahxjgoirc4inolj2; _adsame_fullscreen_16928=1; st_pvi=29837354844280; st_sp=2022-01-03%2017%3A35%3A15; st_inirUrl=https%3A%2F%2Ffund.eastmoney.com%2F; st_sn=7; st_psi=20220108155154122-112200304021-7308268115",
    "Referer": "http://fund.eastmoney.com/manager/default.html",
    "Referrer-Policy": "strict-origin-when-cross-origin"
};

export interface FundManager {
	id: number;
	name: string;
	companyId: number;
	fundList: number[];
	workingTime: number;
}

export async function requestFundManager(task: FundManager[] = [], curPage = 1): Promise<FundManager[]> {
    const response = await fetch(`http://fund.eastmoney.com/Data/FundDataPortfolio_Interface.aspx?dt=14&mc=returnjson&ft=all&pi=${curPage}&sc=abbname&st=asc`, { headers });
    const originData = await response.text();
    const fixedData = originData.replace('var returnjson= ', '').replace(/data|record|pages|curpage/g, x => `"${x}"`);
    const { data, pages } = JSON.parse(fixedData) as {
        data: string[][];
        record: number;
        pages: number;
    };
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
        console.log('load page:', curPage);
        return requestFundManager(managerList, ++curPage);
    }
    return managerList;
}

(async () => {
    const data = await requestFundManager();
    // if (!existsSync(dir)) {
    //     return;
    // }
    console.log(data);
})();
