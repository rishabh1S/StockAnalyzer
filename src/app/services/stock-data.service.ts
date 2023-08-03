import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Observable,
  forkJoin,
  map,
  switchMap,
  interval,
  startWith,
  BehaviorSubject,
  Subject,
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockDataService {
  //Alpha Vantage
  private vantageApiBaseUrl = 'https://www.alphavantage.co';
  private vantageAPIKey1: string = environment.VantageAPIKey1;
  private vantageAPIKey2: string = environment.VantageAPIKey2;
  private vantageAPIKey3: string = environment.VantageAPIKey3;

  //Finnhub
  private finnhubAPIKey: string = environment.FinnhubAPIKey;

  private selectedSymbolSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>('');

  private unsubscribe$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders();
  }

  getSymbolSearchObservable(): Observable<string> {
    return this.selectedSymbolSubject.asObservable();
  }

  searchStocks(keywords: string): Observable<any> {
    const url = `${this.vantageApiBaseUrl}/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${this.vantageAPIKey1}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getStockQuote(symbol: string): Observable<any> {
    const url = `${this.vantageApiBaseUrl}/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.vantageAPIKey3}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  fetchStockData(symbol: string, interval: string): Observable<any> {
    let functionParam: string;
    switch (interval) {
      case '1min':
        functionParam = 'TIME_SERIES_INTRADAY&interval=1min';
        break;
      case '30min':
        functionParam = 'TIME_SERIES_INTRADAY&interval=30min';
        break;
      case 'Daily':
        functionParam = 'TIME_SERIES_DAILY';
        break;
      case 'Weekly':
        functionParam = 'TIME_SERIES_WEEKLY_ADJUSTED';
        break;
      case 'Monthly':
        functionParam = 'TIME_SERIES_MONTHLY_ADJUSTED';
        break;
      default:
        // Default to Intraday with Daily interval
        functionParam = 'TIME_SERIES_DAILY';
        break;
    }

    const url = `${this.vantageApiBaseUrl}/query?function=${functionParam}&symbol=${symbol}&apikey=${this.vantageAPIKey3}`;
    return this.http.get(url);
  }

  fetchNews(): Observable<any> {
    const url = `${this.vantageApiBaseUrl}/query?function=NEWS_SENTIMENT&apikey=${this.vantageAPIKey2}`;
    return this.http.get(url);
  }

  // Market Page
  getTrendingStocks(): Observable<any> {
    const trendingStocksUrl = `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${this.finnhubAPIKey}`;

    return interval(10000).pipe(
      startWith(0),
      switchMap(() => this.http.get<any[]>(trendingStocksUrl)),
      switchMap((symbols: any[]) => {
        const symbolPromises = symbols.slice(0, 5).map((symbol: any) => {
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol.symbol}&token=${this.finnhubAPIKey}`;
          const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.symbol}&token=${this.finnhubAPIKey}`;

          const quoteRequest$ = this.http.get<any>(quoteUrl);
          const profileRequest$ = this.http.get<any>(profileUrl);

          return forkJoin([quoteRequest$, profileRequest$]).pipe(
            map(([quote, profile]) => ({
              symbol: symbol.symbol,
              c: quote.c,
              dp: quote.dp,
              mc: profile.marketCapitalization,
              name: profile.name,
            })),
            takeUntil(this.unsubscribe$)
          );
        });

        return forkJoin(symbolPromises);
      })
    );
  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
