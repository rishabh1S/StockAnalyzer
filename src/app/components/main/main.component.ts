import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StockDataService } from '../../services/stock-data.service';
import { Router } from '@angular/router';
import getSymbolFromCurrency from 'currency-symbol-map';
import ApexCharts from 'apexcharts';
import { formatDate } from '@angular/common';

interface SearchResult {
  '1. symbol': string;
  '2. name': string;
  '4. region': string;
  '8. currency': string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
})
export class MainComponent implements OnInit, OnDestroy {
  searchSubscription: Subscription | undefined;
  searchResults: SearchResult[] = [];
  stockQuote: any = null;
  searchKeywords = new FormControl();
  isProfileDropdownOpen = false;
  isDropdownOpen: boolean = false;
  isSearchBarOpen: boolean = false;
  shouldApplyDropShadow: boolean = false;
  showSearchBar: boolean = false;
  selectedIndex = -1;
  selectedSymbol: string = '';
  selectedStockName = '';
  selectedStockCurrency = '';
  lastRefreshedDate: string = '';
  selectedInterval: string = 'Daily';
  chart: ApexCharts | undefined;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private stockDataService: StockDataService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchKeywords.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
        switchMap((keywords: string) =>
          this.stockDataService.searchStocks(keywords)
        )
      )
      .subscribe({
        next: (results: any) => {
          this.searchResults = results.bestMatches.slice(0, 5);
          this.selectedIndex = -1;
        },
        error: (error: any) => {
          console.error('Error searching stocks:', error);
        },
      });

    this.stockDataService
      .fetchStockData(this.selectedSymbol, this.selectedInterval)
      .subscribe(() => {
        this.initializeChart();
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.shouldApplyDropShadow = window.scrollY > 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdowns = document.getElementsByClassName('dropdown');
    const searchInput = this.searchInput.nativeElement;
    const profileButton = document.getElementById('profile-button');

    if (profileButton && !profileButton.contains(target)) {
      this.isProfileDropdownOpen = false;
    }

    let isTargetInsideDropdown = false;
    for (let i = 0; i < dropdowns.length; i++) {
      const dropdown = dropdowns[i] as HTMLElement;
      if (dropdown.contains(target)) {
        isTargetInsideDropdown = true;
        break;
      }
    }
    if (!isTargetInsideDropdown && target !== searchInput) {
      this.isDropdownOpen = false;
    }
  }

  initializeChart(): void {
    const options = this.getChartOptions();
    if (
      document.getElementById('area-chart') &&
      typeof ApexCharts !== 'undefined'
    ) {
      this.chart = new ApexCharts(
        document.getElementById('area-chart'),
        options
      );
      this.chart.render();
    }
  }

  getChartOptions() {
    return {
      chart: {
        height: '100%',
        maxWidth: '100%',
        type: 'area',
        fontFamily: 'Inter, sans-serif',
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      tooltip: {
        enabled: true,
        x: {
          show: false,
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: '', // The shade color will be set dynamically
          gradientToColors: [], // The gradient color will be set dynamically
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 3,
      },
      grid: {
        show: false,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0,
        },
      },
      series: [
        {
          name: 'Price',
          data: [],
        },
      ],
      xaxis: {
        categories: [],
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        show: true,
        labels: {
          show: true,
          style: {
            colors: '#9CA3AF',
          },
        },
      },
    };
  }

  searchStocks(event: Event) {
    event.preventDefault();
    const keywords = this.searchKeywords.value;
    this.searchResults = [];
    this.stockQuote = null; // Clear previous stock quote information
    this.stockDataService.searchStocks(keywords).subscribe({
      next: (results: any) => {
        this.searchResults = results.bestMatches.slice(0, 5);
        this.selectedIndex = -1;
        if (this.searchResults.length === 0) {
          console.log('No match for this symbol.');
        }
      },
      error: (error: any) => {
        console.error('Error searching stocks:', error);
      },
    });
  }

  fetchStockQuote(symbol: string): Observable<any> {
    return this.stockDataService.getStockQuote(symbol);
  }

  selectResult(symbol: string, interval: string): void {
    this.selectedSymbol = symbol;
    this.selectedInterval = interval;
    this.stockQuote = null;

    this.stockDataService.fetchStockData(symbol, interval).subscribe({
      next: (data: any) => {
        console.log(data);

        // Extract the necessary data from the API response
        let timestamps: string[] = [];
        let prices: number[] = [];
        this.lastRefreshedDate = data['Meta Data']['3. Last Refreshed'];

        const intervalMappings: {
          [key: string]: { dataKey: string; points?: number };
        } = {
          '1min': { dataKey: 'Time Series (1min)' },
          '30min': { dataKey: 'Time Series (30min)', points: 50 },
          Daily: { dataKey: 'Time Series (Daily)', points: 30 },
          Weekly: { dataKey: 'Weekly Time Series', points: 52 },
          Monthly: { dataKey: 'Monthly Time Series', points: 60 },
        };

        if (data && intervalMappings[interval]) {
          const { dataKey, points } = intervalMappings[interval];
          timestamps = Object.keys(data[dataKey]);
          prices = timestamps.map((timestamp: string) =>
            parseFloat(data[dataKey][timestamp]['4. close'])
          );
          if (points) {
            timestamps = timestamps.slice(0, points);
            prices = prices.slice(0, points);
          }
        }

        // Reverse the order of data points
        timestamps = timestamps.reverse();
        prices = prices.reverse();

        // Define date format strings
        const dateFormatMap: { [key: string]: string } = {
          '1min': 'h:mm a',
          '30min': 'MMM d, h:mm a',
          Daily: 'MMM d',
          Weekly: 'MMM yyyy',
          Monthly: 'MMM yyyy',
        };

        // Update the chart data
        if (this.chart) {
          let formattedTimestamps: string[] = [];
          if (interval === '1min') {
            formattedTimestamps = formattedTimestamps = timestamps.map(
              (timestamp: string) =>
                formatDate(new Date(timestamp), 'h:mm a', 'en-US')
            );
          } else if (interval === '30min') {
            formattedTimestamps = timestamps.map((timestamp: string) =>
              formatDate(new Date(timestamp), 'MMM d, h:mm a', 'en-US')
            );
          } else if (interval === 'Daily') {
            formattedTimestamps = timestamps.map((timestamp: string) =>
              formatDate(new Date(timestamp), 'MMM d', 'en-US')
            );
          } else if (interval === 'Weekly') {
            formattedTimestamps = timestamps.map((timestamp: string) =>
              formatDate(new Date(timestamp), 'MMM yyyy', 'en-US')
            );
          } else if (interval === 'Monthly') {
            formattedTimestamps = timestamps.map((timestamp: string) =>
              formatDate(new Date(timestamp), 'MMM yyyy', 'en-US')
            );
          }

          this.chart.updateSeries([
            {
              name: 'Prices',
              data: prices,
            },
          ]);
          this.chart.updateOptions({
            xaxis: {
              categories: formattedTimestamps,
            },
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching stock data:', error);
      },
    });

    this.stockDataService.getStockQuote(symbol).subscribe({
      next: (quote: any) => {
        this.stockQuote = quote['Global Quote'];
        this.selectedStockName = this.getStockName(symbol);
        this.selectedStockCurrency = this.getStockCurrency(symbol);
        this.closeDropdown();
        const changePercent = parseFloat(
          quote['Global Quote']['10. change percent'].replace('%', '')
        );
        let lineColor: string;
        let gradientFromColor: string = '';
        let gradientToColor: string = '';
        if (changePercent > 0) {
          lineColor = 'rgba(0, 255, 0, 1)';
          gradientFromColor = 'rgba(0, 255, 0, 0.25)';
          gradientToColor = 'rgba(0, 255, 0, 0.05)';
        } else if (changePercent < 0) {
          lineColor = 'rgba(255, 0, 0, 1)';
          gradientFromColor = 'rgba(255, 0, 0, 0.25)';
          gradientToColor = 'rgba(255, 0, 0, 0.05)';
        } else {
          lineColor = 'rgba(0, 143, 251, 1)';
          gradientFromColor = 'rgba(0, 143, 251, 0.25)';
          gradientToColor = 'rgba(0, 143, 251, 0.05)';
        }

        if (this.chart) {
          this.chart.updateOptions({
            colors: [lineColor],
            fill: {
              gradient: {
                shade: gradientFromColor, // Update the gradient shade color
                gradientToColors: [gradientToColor], // Update the gradient colors
              },
            },
          });
        }
      },
      error: (error: any) => {
        console.error('Error retrieving stock quote:', error);
      },
    });
  }

  switchAccount(): void {
    this.router.navigateByUrl('/login');
  }

  logout() {
    this.authService.signOut().then(() => {
      console.log('Logout Successfull');
      this.router.navigate(['/login']);
    });
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  toggleSearchIcon(): void {
    this.isSearchBarOpen = !this.isSearchBarOpen;
  }

  toggleDropdown() {
    this.isDropdownOpen = true;
  }

  toggleSearchBar(): void {
    if (window.innerWidth < 992) {
      this.showSearchBar = !this.showSearchBar;
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  clearSearch(): void {
    this.searchKeywords.setValue('');
    this.closeDropdown();
  }

  getCurrencySymbol(currency: string): string {
    const currencySymbol = getSymbolFromCurrency(currency);
    if (currencySymbol) {
      return currencySymbol;
    }
    return '';
  }

  getStockName(symbol: string): string {
    const stock = this.searchResults.find(
      (result) => result['1. symbol'] === symbol
    );
    return stock ? stock['2. name'] : '';
  }

  getStockCurrency(symbol: string): string {
    const stock = this.searchResults.find(
      (result) => result['1. symbol'] === symbol
    );
    return stock ? stock['8. currency'] : '';
  }
}
