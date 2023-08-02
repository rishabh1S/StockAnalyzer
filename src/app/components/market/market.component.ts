import { Component, OnInit, OnDestroy } from '@angular/core';
import { StockDataService } from 'src/app/services/stock-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.css'],
})
export class MarketComponent implements OnInit, OnDestroy {
  isSmallScreen = false;
  trendingStocks: any[] = [];
  private trendingStocksSubscription: Subscription = new Subscription();

  constructor(private stockService: StockDataService) {}

  ngOnInit() {
    this.trendingStocksSubscription = this.stockService
      .getTrendingStocks()
      .subscribe({
        next: (stocks) => {
          this.trendingStocks = stocks;
        },
        error: (error) => {
          console.log('Error retrieving trending stocks:', error);
        },
      });
  }

  getStockName(index: number): string {
    return this.trendingStocks[index]?.name || 'Not Available';
  }

  getStockSymbol(index: number): string {
    return this.trendingStocks[index]?.symbol || 'NA';
  }

  getStockPrice(index: number): number {
    return this.trendingStocks[index]?.c || 0;
  }

  getStockPercentage(index: number): number {
    return this.trendingStocks[index]?.dp?.toFixed(2) || 0;
  }

  getMarketCap(index: number): number {
    return this.trendingStocks[index]?.mc || 0;
  }

  ngOnDestroy() {
    this.trendingStocksSubscription.unsubscribe();
  }
}
