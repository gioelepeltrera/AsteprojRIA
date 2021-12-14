/**
 * 
 */
 (function(){
    let searchAuctions, searchedList, buyAuctionInfo, myWonAuctions, lastItemsViewed, cookieHandler, contextHandler, myOpenAuctions, myClosedAuctions, sellAuctionInfo, createAuctionWizard; 

    let pageOrchestrator = new PageOrchestrator();
    window.addEventListener("load", () => {
		if (sessionStorage.getItem("username") == null) {
			window.location.href = "index.html";
		}else {
			pageOrchestrator.start();
		}
	}, false);
	
	function BuyAuctionInfo(buyAuctionInfoContainer, buyAuctionInfo, buyAuctionInfoBody, buyAuctionBidsContainer, buyAuctionBidsTable,  buyAuctionBidsTableBody , noBuyAuctionBids, AuctionInfoAlert, makeBidForm, makeBidFormInput, makeBidFormCodArt, makeBidAlert){
		this.buyAuctionInfoContainer = buyAuctionInfoContainer;
		this.buyAuctionInfo = buyAuctionInfo;
		this.buyAuctionInfoBody = buyAuctionInfoBody;
		this.buyAuctionBidsContainer = buyAuctionBidsContainer;
		this.buyAuctionBidsTable = buyAuctionBidsTable;
		this.buyAuctionBidsTableBody = buyAuctionBidsTableBody;
		this.noBuyAuctionBids = noBuyAuctionBids;
		this.buyAuctionInfoAlert = buyAuctionInfoAlert;
		this.makeBidForm = makeBidForm;
		this.makeBidFormInput = makeBidFormInput;
		this.makeBidFormCodArt = makeBidFormCodArt;
		this.makeBidAlert = makeBidAlert;
		
		this.show = function (codArt, maxBid) {
			var self = this;
			var maxBid = maxBid;
			makeCall("GET", 'GetAuctionInfo?codArt='+codArt, null, 
					function(req){
				          if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
                                        var parsed = JSON.parse(message);
                                        self.updateInfo(parsed, maxBid);
                                        cookieHandler.setContextCookie("compro");

                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.reset();
                                        self.buyAuctionInfoAlert.textContent = message;
                                    }
                                }
			});
			this.getAuctionBids(codArt);
			buyAuctionInfoContainer.style.display= "block";

		};
		
		this.getAuctionBids = function(codArt){
			var self = this;
			makeCall("GET", 'GetAuctionBids?codArt='+codArt, null, 
					function(req){
				          if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
                                        var parsed = JSON.parse(message);
                                        self.updateBids(parsed, codArt);
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.reset();
                                        self.buyAuctionInfoAlert.textContent = message;
                                    }
                                }
			});
		}
		this.setMakeBid = function(codArt, minBid) {
			this.makeBidFormInput.min = minBid;
			this.makeBidFormInput.value = minBid;
			this.makeBidFormCodArt.value = codArt;
		}
		this.updateMakeBid = function(codArt, minBid){
			this.setMakeBid(codArt, minBid);
			this.getAuctionBids(codArt);
		};
		
		this.registerMakeBidEvents = function (pageOrchestrator){
            this.makeBidForm.querySelector('button[type="submit"]').addEventListener('click', 
                (e) => {
                    var valid = this.makeBidForm.reportValidity();
                    if(valid){
                        this.makeBidAlert.textContent ="";
                        var self = this;
                        makeCall("POST", 'MakeBid', e.target.closest("form"),
                            function(req) {
                                if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
	                                    cookieHandler.setContextCookie("compro");
                                        var parsed = JSON.parse(message);
                                        if(Object.keys(parsed).length >0){
                                            self.updateMakeBid(parsed.codArt, Number(parsed.minBid));
                                        }else{
                                            self.makeBidAlert.textContent = "impossibile fare offerta";
                                        }
                                        
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.makeBidAlert.textContent = message;
                                    }
                                }
                            })
                    }
                })
        }
		
		this.updateInfo = function(infoArt, maxBid){
			cookieHandler.addAuctionCookie(infoArt);
			document.getElementById("buyAuctionInfoTableBodyNomeArt").textContent = infoArt.nomeArt;
			document.getElementById("buyAuctionInfoTableBodyDescription").textContent = infoArt.description;
			document.getElementById("buyAuctionInfoTableBodyStartingPrice").textContent = infoArt.startingPrice;
			document.getElementById("buyAuctionInfoTableBodyMinimumRaise").textContent = infoArt.minimumRaise;
			document.getElementById("buyAuctionInfoTableBodyExpDate").textContent = new Date(infoArt.expDate).toString().substring(0,21);
			document.getElementById("infoAuctionImg").src = "data:image/jpeg;base64,"+infoArt.image;
			var minBid = infoArt.startingPrice;
			if(maxBid >0){
				minBid = Number(maxBid)+Number(infoArt.minimumRaise);	
			}		
			this.setMakeBid(infoArt.codArt, minBid);

		};
		this.updateBids = function(auctionBids, art){
			buyAuctionBidsTableBody.innerHTML = "";
			buyAuctionBidsTable.style.display= "none";
            var maxBid = 0, codArt = 0;
			if(Object.keys(auctionBids).length >0){
				noBuyAuctionBids.textContent = "";
				var self = this;
				var row, unameCell, bidValCell, bidDateCell, maxBid;
				auctionBids.forEach(function(bid){
					row = document.createElement("tr");
					unameCell = document.createElement("td");
					unameCell.textContent = bid.username;
					row.appendChild(unameCell);
					bidValCell = document.createElement("td");
					bidValCell.textContent = bid.value;
                    if(bid.value > maxBid){
                        maxBid = bid.value; 
                    }
					row.appendChild(bidValCell);
					bidDateCell =  document.createElement("td");
					bidDateCell.textContent = new Date(bid.date).toString().substring(0,21);
					row.appendChild(bidDateCell);
					self.buyAuctionBidsTableBody.appendChild(row);
				});
				buyAuctionBidsTable.style.display= "block";
                this.setMakeBid(art, maxBid);
				
			} else {
				
				noBuyAuctionBids.textContent = "Ancora non ci sono offerte per questa asta";
			}
			
		};
		
		this.reset = function(){
			buyAuctionInfoAlert.textContent = "";

			buyAuctionInfoContainer.style.display= "none";
		}
		
	}
	
	function MyWonAuctions(wonAuctionsContainer, wonAuctionsTable, wonAuctionsBody, wonAuctionsAlert){
		this.wonAuctionsContainer = wonAuctionsContainer;
		this.wonAuctionsTable = wonAuctionsTable;
		this.wonAuctionsBody = wonAuctionsBody;
		this.wonAuctionsAlert = wonAuctionsAlert;

		this.show = function(){
			var self = this;
			makeCall("GET", 'GetWonAuctions', null, 
					function(req){
				          if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
                                        var parsed = JSON.parse(message);
                                        self.update(parsed);
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.reset();
                                        self.wonAuctionsAlert.textContent = message;
                                    }
                                }
			});
		};
		
		this.update = function(listWonAuctions){
			var row, nameCell, maxBidCell, expDateCell;
			var self = this;
			this.wonAuctionsBody.innerHTML = "";

			if(Object.keys(listWonAuctions).length >0){
				listWonAuctions.forEach(function(auction){
					row = document.createElement("tr");
					nameCell = document.createElement("td");
					nameCell.textContent = auction.artName;
					row.appendChild(nameCell);
					maxBidCell = document.createElement("td");
					maxBidCell.textContent = auction.maxBid;
					row.appendChild(maxBidCell);
					expDateCell =  document.createElement("td");
					expDateCell.textContent = new Date(auction.expDate).toString().substring(0,21);
					row.appendChild(expDateCell);
					self.wonAuctionsBody.appendChild(row);
				});
				wonAuctionsContainer.style.display= "block";

			} else {
				this.wonAuctionsAlert.textContent= "Non hai ancora vinto nessuna asta";
				wonAuctionsContainer.style.display= "none";
			}
			
		};
		this.reset = function(){
			this.wonAuctionsAlert.textContent = "";
			this.wonAuctionsBody.innerHTML= "";

		};
	}
	
	function SearchedList( searchListBody, searchListContainer){
		this.searchListBody = searchListBody;
		this.searchListContainer = searchListContainer;
		
		this.update = function(searchResult){
			var row, nameAuctionCell, maxBidCell, dLeftCell, hLeftCell, mLeftCell, expDatecell, anchor;
			var self = this;
			this.reset();
			searchResult.forEach(function(auction){
				row = document.createElement("tr");
				
				nameAuctionCell = document.createElement("td");
				nameAuctionCell.classList.add("linked");
				anchor =  document.createElement("a");
				anchor.setAttribute('codArt', auction.codArt);
				anchor.setAttribute('maxBid', auction.maxBid);
				anchor.addEventListener("click", (e) =>{
					buyAuctionInfo.show(e.target.getAttribute('codArt'), e.target.getAttribute('maxBid'));
					searchedList.hide();

				}, false);
				anchor.textContent = auction.artName;
				anchor.href = "#";
				nameAuctionCell.appendChild(anchor);
				row.appendChild(nameAuctionCell);
				maxBidCell = document.createElement("td");
				maxBidCell.textContent = auction.maxBid;
				row.appendChild(maxBidCell);
				dLeftCell = document.createElement("td");
				dLeftCell.textContent = auction.daysLeft;
				row.appendChild(dLeftCell);
				hLeftCell = document.createElement("td");
				hLeftCell.textContent = auction.hoursLeft;
				row.appendChild(hLeftCell);
				mLeftCell = document.createElement("td");
				mLeftCell.textContent = auction.minutesLeft;
				row.appendChild(mLeftCell);
				expDateCell = document.createElement("td");
				expDateCell.textContent = new Date(auction.expDate).toString().substring(0,21);
				row.appendChild(expDateCell);
				
				self.searchListBody.appendChild(row);
				 
				
			});
			this.show();
		}
		
		this.reset = function(){
			this.searchListBody.innerHTML ="";
			this.hide();
		}
		
		this.hide = function(){
			this.searchListContainer.style.display= "none";
		}
		
		this.show = function(){
			this.searchListContainer.style.display= "flex";
		}
		
		
	}
	
    function SearchAuctionsForm(searchForm, searchAlert){
        this.searchForm = searchForm;
        this.searchAlert = searchAlert;

        this.reset = function(){
            this.searchAlert.style.visibility = "hidden";
        } 
        this.registerEvents = function (pageOrchestrator){
            this.searchForm.querySelector('button[type="submit"]').addEventListener('click', 
                (e) => {
                    var valid = this.searchForm.reportValidity();
                    if(valid){
                        this.searchAlert.textContent ="";
                        var self = this;
                        makeCall("POST", 'SearchAuctions', e.target.closest("form"),
                            function(req) {
                                if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
	                                    cookieHandler.setContextCookie("compro");
                                        var parsed = JSON.parse(message);
                                        if(Object.keys(parsed).length >0){
                                            pageOrchestrator.refreshSearchList(parsed);
                                        }else{
                                            self.searchAlert.textContent = "nessuna asta aperta per la parola chiave inserita";
                                        }
                                        
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.searchAlert.textContent = message;
                                        self.reset();
                                    }
                                }
                            });
                    }
                })
        }
        
    };
	
	function MyOpenAuctions(openAuctionListContainer, openAuctionListTable, openAuctionListBody, openAuctionAlert ){
		this.openAuctionListContainer = openAuctionListContainer;
		this.openAuctionListTable = openAuctionListTable;
		this.openAuctionListBody = openAuctionListBody;
		this.openAuctionAlert = openAuctionAlert;
		
			this.update = function(){
				var self = this;
				openAuctionListBody.innerHTML = "";
				makeCall("GET", 'GetOpenAuctions',null,
	                function(req) {
	                    if (req.readyState == XMLHttpRequest.DONE) {
	                        var message = req.responseText; 
	                        if (req.status == 200) {
	                            var parsed = JSON.parse(message);
	                            if(Object.keys(parsed).length >0){
	                                self.show(parsed);
	                            }else{
	                                self.openAuctionAlert.textContent = "Ancora non hai nessuna asta aperta";
									self.hideTable();
	                            }
	                            
	                        } else if (req.status == 403){
								window.location.href = req.getResponseHeader("Location");
								window.sessionStorage.removeItem('username');
							} else {
	                            self.searchAlert.textContent = message;
								self.hideTable();
	                        }
	                    }
	                });
			};
			
			
			this.show = function(auctions){
				var row,idAuctionCell, nameAuctionCell, maxBidCell, dLeftCell, hLeftCell, mLeftCell, expDatecell, anchor;
				var self = this;
				let now;
				now = new Date();
				let nowCEST = now.getTime();

				auctions.forEach(function(auction){
					row = document.createElement("tr");
					
					idAuctionCell = document.createElement("td");
					idAuctionCell.textContent = auction.codArt;
					row.appendChild(idAuctionCell);
					nameAuctionCell = document.createElement("td");
					nameAuctionCell.classList.add("linked");
					anchor =  document.createElement("a");
					anchor.setAttribute('codArt', auction.codArt);
					anchor.addEventListener("click", (e) =>{
						sellAuctionInfo.show(e.target.getAttribute('codArt'));
					}, false);
					anchor.textContent = auction.artName;
					anchor.href = "#";
					nameAuctionCell.appendChild(anchor);
					row.appendChild(nameAuctionCell);
					maxBidCell = document.createElement("td");
					maxBidCell.textContent = auction.maxBid;
					row.appendChild(maxBidCell);
					dLeftCell = document.createElement("td");
					dLeftCell.textContent = auction.daysLeft;
					row.appendChild(dLeftCell);
					hLeftCell = document.createElement("td");
					hLeftCell.textContent = auction.hoursLeft;
					row.appendChild(hLeftCell);
					mLeftCell = document.createElement("td");
					mLeftCell.textContent = auction.minutesLeft;
					row.appendChild(mLeftCell);
					expDateCell = document.createElement("td");
					expDateCell.textContent = new Date(auction.expDate).toString().substring(0,21);
					row.appendChild(expDateCell);
					let aucDate = Date.parse(auction.expDate);
					
					if(aucDate<nowCEST){
						row.style.backgroundColor = "brown";
					}
					self.openAuctionListBody.appendChild(row);
					 
				});
				this.showTable();
			}
			
		this.hideTable = function(){
			this.openAuctionListTable.style.display = "none";
		};
		this.showTable = function(){
			this.openAuctionAlert.textContent ="";
			this.openAuctionListTable.style.display = "block";
		};
	};
	
	function MyClosedAuctions(closedAuctionListContainer, closedAuctionListTable, closedAuctionListBody, closedAuctionAlert ){
			this.closedAuctionListContainer = closedAuctionListContainer;
			this.closedAuctionListTable = closedAuctionListTable;
			this.closedAuctionListBody = closedAuctionListBody;
			this.closedAuctionAlert = closedAuctionAlert;
			
			this.update = function(){
				var self = this;
				closedAuctionListBody.innerHTML = "";
				makeCall("GET", 'GetClosedAuctions',null,
	                function(req) {
	                    if (req.readyState == XMLHttpRequest.DONE) {
	                        var message = req.responseText; 
	                        if (req.status == 200) {
	                            var parsed = JSON.parse(message);
	                            if(Object.keys(parsed).length >0){
	                                self.show(parsed);
	                            }else{
	                                self.closedAuctionAlert.textContent = "Ancora non hai nessuna asta chiusa";
									self.hideTable();
	                            }
	                            
	                        } else if (req.status == 403){
								window.location.href = req.getResponseHeader("Location");
								window.sessionStorage.removeItem('username');
							} else {
	                            self.searchAlert.textContent = message;
	                            self.hideTable();
	                        }
	                    }
	                });
			};
			this.show = function(auctions){
				var row, idAuctionCell, nameAuctionCell, maxBidCell, dLeftCell, hLeftCell, mLeftCell, expDatecell, anchor;
				var self = this;
				auctions.forEach(function(auction){
					row = document.createElement("tr");
					
					idAuctionCell = document.createElement("td");
					idAuctionCell.textContent = auction.codArt;
					row.appendChild(idAuctionCell);
					nameAuctionCell = document.createElement("td");
					nameAuctionCell.classList.add("linked");
					anchor =  document.createElement("a");
					anchor.setAttribute('codArt', auction.codArt);
					anchor.addEventListener("click", (e) =>{
						sellAuctionInfo.show(e.target.getAttribute('codArt'));
					}, false);
					anchor.textContent = auction.artName;
					anchor.href = "#";
					nameAuctionCell.appendChild(anchor);
					row.appendChild(nameAuctionCell);
					maxBidCell = document.createElement("td");
					maxBidCell.textContent = auction.maxBid;
					row.appendChild(maxBidCell);
					dLeftCell = document.createElement("td");
					dLeftCell.textContent = auction.daysLeft;
					row.appendChild(dLeftCell);
					hLeftCell = document.createElement("td");
					hLeftCell.textContent = auction.hoursLeft;
					row.appendChild(hLeftCell);
					mLeftCell = document.createElement("td");
					mLeftCell.textContent = auction.minutesLeft;
					row.appendChild(mLeftCell);
					expDateCell = document.createElement("td");
					expDateCell.textContent = new Date(auction.expDate).toString().substring(0,21);
					row.appendChild(expDateCell);
					
					self.closedAuctionListBody.appendChild(row);
					 
				});
				this.showTable();
			}
			
			this.hideTable = function(){
				this.closedAuctionListTable.style.display = "none";
			};
			this.showTable = function(){
				this.closedAuctionAlert.textContent ="";
				this.closedAuctionListTable.style.display = "block";
			};
			
	};


	function SellAuctionInfo(sellAuctionInfoContainer, sellAuctionInfo, sellAuctionBids, closeAuctionForm, winnerAuctionInfo){
			this.sellAuctionInfoContainer = sellAuctionInfoContainer;
			this.sellAuctionInfo = sellAuctionInfo;
			this.sellAuctionBids = sellAuctionBids;
			this.closeAuctionForm = closeAuctionForm;
			this.winnerAuctionInfo = winnerAuctionInfo;
			
		this.hide = function () {
			sellAuctionInfoContainer.style.display = "none";
		}
		this.show = function (codArt) {
			sellAuctionInfoContainer.style.display = "block";
			var self = this;
			makeCall("GET", 'GetAuctionInfo?codArt='+codArt, null, 
					function(req){
				          if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
	                                    cookieHandler.setContextCookie("compro");
                                        var parsed = JSON.parse(message);
                                        self.update(parsed);
                                        
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.sellAuctionInfo.table.style.display  = "none";
                                        self.sellAuctionInfo.alert.textContent = message;
                                    }
                                }
			});
			
		};
		
		this.update = function(auction){
			let now;
			now = new Date();
			let nowCEST = now.getTime();
			let aucDate = Date.parse(auction.expDate);
			this.showInfo(auction);
			if(auction.closed == false){
				// get Auction bids
				this.getAuctionBids(auction.codArt);
				if(aucDate < nowCEST){
					this.closeAuctionForm.input.value = auction.codArt;
					this.showClose();
				} else {
					this.hideClose();
				}
				this.hideWinnerInfo();
			} else {
				this.hideClose();
				this.hideBids();
				this.getWinnerInfo(auction.codArt);
			}


		}
		this.hideWinnerInfo = function(){
			this.winnerAuctionInfo.alert.textContent = "";
			this.winnerAuctionInfo.container.style.display  = "none";
		}
		
		this.showWinnerInfo = function(winnerInfo) {
			this.winnerAuctionInfo.container.style.display  = "block";
			if(winnerInfo == null){
				this.winnerAuctionInfo.table.style.visibility ="collapse";
				this.winnerAuctionInfo.alert.textContent = "Questa asta non ha ricevuto nessuna offerta.";
			} else {
				this.winnerAuctionInfo.alert.textContent = "";
				this.winnerAuctionInfo.username.textContent = winnerInfo.username;
				this.winnerAuctionInfo.spedInfo.textContent = winnerInfo.DatiSpedizione; 
				this.winnerAuctionInfo.bid.textContent = winnerInfo.finalBid;
				
				this.winnerAuctionInfo.table.style.visibility ="visible";
				
			}


		}
		this.getWinnerInfo  = function(codArt){
			var self = this;
			winnerAuctionInfo.container.style.display ="block";
			makeCall("GET", 'GetAuctionWinner?codArt='+codArt, null, 
					function(req){
				          if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
                                        var parsed = JSON.parse(message);
                                        self.showWinnerInfo(parsed);
                                        
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.winnerAuctionInfo.alert.textContent = message;
										self.winnerAuctionInfo.table.style.visibility ="collapse";
                                    }
                                }
			});
		}
		
		this.hideBids = function(){
			this.sellAuctionBids.alert.textContent = "";
			this.sellAuctionBids.container.style.display  = "none";
		}
		
		this.showClose = function(){
			this.closeAuctionForm.container.style.display  = "block";

		}
		
		this.hideClose = function(){
			this.closeAuctionForm.alert.textContent = "";
			this.closeAuctionForm.container.style.display  = "none";
		}
		
		this.getAuctionBids = function(codArt){
			var self = this;
			makeCall("GET", 'GetAuctionBids?codArt='+codArt, null, 
					function(req){
				          if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
                                        var parsed = JSON.parse(message);
                                        self.showBids(parsed);
                                        
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.sellAuctionBids.alert.textContent = message;
										self.sellAuctionBids.table.style.display ="none";
                                    }
                                }
			});
		}
		
		this.registerCloseAuctionEvents = function (pageOrchestrator){
            this.closeAuctionForm.form.querySelector('button[type="submit"]').addEventListener('click', 
                (e) => {
					e.preventDefault();
                    var valid = this.closeAuctionForm.form.reportValidity();
                    if(valid){
                        this.closeAuctionForm.alert.textContent ="";
                        var self = this;
                        makeCall("POST", 'CloseAuction', e.target.closest("form"),
                            function(req) {
                                if (req.readyState == XMLHttpRequest.DONE) {
                                    var message = req.responseText; 
                                    if (req.status == 200) {
	                                   cookieHandler.setContextCookie("compro");
                                        var parsed = JSON.parse(message);
                                        if(Object.keys(parsed).length >0){
                                            self.show(parsed.codArt);
											pageOrchestrator.updateMySellAuctions();
                                        }else{
                                            self.closeAuctionForm.alert.textContent = "impossibile chiudere l'asta'";
                                        }
                                        
                                    } else if (req.status == 403){
										window.location.href = req.getResponseHeader("Location");
										window.sessionStorage.removeItem('username');
									} else {
                                        self.closeAuctionForm.alert.textContent = message;
                                    }
                                }
                            })
                    }
                }, false);
        }
		
		this.showInfo = function(infoArt){
			sellAuctionInfo.table.style.display  = "block";
			sellAuctionInfo.alert.textContent = "";

			sellAuctionInfo.nomeArt.textContent = infoArt.nomeArt;
			sellAuctionInfo.description.textContent = infoArt.description;
			sellAuctionInfo.startingPrice.textContent = infoArt.startingPrice;
			sellAuctionInfo.minimumRaise.textContent = infoArt.minimumRaise;
			sellAuctionInfo.expDate.textContent = new Date(infoArt.expDate).toString().substring(0,21);
			sellAuctionInfo.img.src = "data:image/jpeg;base64,"+infoArt.image;
			sellAuctionInfo.container.style.display = "block";
		};
		
		this.showBids = function(auctionBids){
			sellAuctionBids.alert.textContent = "";
			sellAuctionBids.body.innerHTML = "";
			sellAuctionBids.table.style.display= "none";
			if(Object.keys(auctionBids).length >0){
				sellAuctionBids.alert.textContent = "";
				var self = this;
				var row, unameCell, bidValCell, bidDateCell;
				
				auctionBids.forEach(function(bid){
					row = document.createElement("tr");
					unameCell = document.createElement("td");
					unameCell.textContent = bid.username;
					row.appendChild(unameCell);
					bidValCell = document.createElement("td");
					bidValCell.textContent = bid.value;
					row.appendChild(bidValCell);
					bidDateCell =  document.createElement("td");
					bidDateCell.textContent = new Date(bid.date).toString().substring(0,21);
					row.appendChild(bidDateCell);
					self.sellAuctionBids.body.appendChild(row);
				});
				sellAuctionBids.table.style.display= "block";

				
			} else {
				
				sellAuctionBids.alert.textContent = "Ancora non ci sono offerte per questa asta";
			}
			sellAuctionBids.container.style.display= "block";
			
		};
		
		this.reset = function(){
			buyAuctionInfoAlert.textContent = "";

			buyAuctionInfoContainer.style.display= "none";
		}
		
	}
	



	function CookieHandler (lastViewedListContainer, lastViewedBody){
		this.lastViewedListContainer =lastViewedListContainer;
		this.lastViewedBody = lastViewedBody;
		
		this.start = function (pageOrchestrator){
			var context = this.getCookie("context");
			if(context == "" ){
				this.setContextCookie("compro");
				context = "compro";
			}
			
		}
		this.getCookie = function(cname){
			let name = cname +"=";
			let docodedCookie;
			decodedCookie = decodeURIComponent(document.cookie); 
			let cookieArray = decodedCookie.split(';');
			for(let i=0 ; i<cookieArray.length; i++){
				let c = cookieArray[i];
				while (c.charAt(0) == ' ') {
			      c = c.substring(1);
			    }
				if (c.indexOf(name) == 0){
					return c.substring(name.length, c.length);
				}
			}
			return "";
		}
		this.setContextCookie = function (context){
			const d = new Date();
			d.setTime(d.getTime() + (30*24*60*60*1000)); //30 days duration
			let expires = "expires="+ d.toUTCString();
			document.cookie = "context" + "=" + context + ";" + expires + ";path=/AsteProjRIA";
		}
		
		this.addAuctionCookie = function (auction) {
			//let auctions = this.getCookie(lastAuctions);
			let aucCopy = JSON.parse(JSON.stringify(auction));
			const d = new Date();
			d.setTime(d.getTime() +(1000*60*60*2) +(30*24*60*60*1000)); //30 days duration +2hours to CEST
			let expires = "expires="+ d.toUTCString();
			delete aucCopy.image;
			delete aucCopy.idUser;
			delete aucCopy.description;
			delete aucCopy.startingPrice;
			delete aucCopy.minimumRaise;
			delete aucCopy.closed;
			
			let aucCookie;
			aucCookie = this.getCookie("auctions");
			let auctions;
			if(aucCookie == ""){
				auctions = [];
				auctions.push(aucCopy);
			}else {
				auctions = this.delExpired(JSON.parse(aucCookie));
				let len = auctions.length;
				let bool = true;
				while(bool && len>0){
					let a = auctions[len-1];
					if(a.codArt === aucCopy.codArt){
						auctions.splice(len-1, 1);
						bool = false;
					}
					len = len-1;
				}
				if(auctions.length >4){
					len = auctions.length;
					auctions.splice(0, 1);
				}
				auctions.push(aucCopy);
			}
			let cook = JSON.stringify(auctions);

			
			
			document.cookie = "auctions" + "=" + cook + ";" + expires + ";path=/AsteProjRIA";
			this.showRecentList();
			
		
		}
		
		this.delExpired = function(auctions){
		
			let now;
			now = new Date();
			let nowCEST = now.getTime()+(1000*60*60*2);
			let aucDate = Date.parse(auctions[0].expDate);
			let len = auctions.length;
			while(len > 0){
				let a = auctions[len-1];
				if(aucDate<nowCEST){
					auctions.splice(len-1, 1);
				}
				len = len-1;
			}
				
			return auctions
		}
		
		this.showRecentList = function(){
			let aucCookies = this.getCookie("auctions");
			if(aucCookies == ""){
				this.hide();
				return;
			}
			this.reset();
			var auctions = JSON.parse(aucCookies);
			var row, nameAuctionCell, expDatecell, anchor;
			var self = this;
			auctions.forEach(function(auction){
				row = document.createElement("tr");
				
				nameAuctionCell = document.createElement("td");
				nameAuctionCell.classList.add("linked");
				anchor =  document.createElement("a");
				anchor.setAttribute('codArt', auction.codArt);
				anchor.setAttribute('maxBid', 0);
				anchor.addEventListener("click", (e) =>{
					buyAuctionInfo.show(e.target.getAttribute('codArt'), e.target.getAttribute('maxBid'));
				}, false);
				anchor.textContent = auction.nomeArt;
				anchor.href = "#";
				nameAuctionCell.appendChild(anchor);
				row.appendChild(nameAuctionCell);
				expDateCell = document.createElement("td");
				expDateCell.textContent = new Date(auction.expDate).toString().substring(0,21);
				row.appendChild(expDateCell);
				self.lastViewedBody.appendChild(row);
				 
				
			});
			this.show();
			
			
		}
		
		this.hide = function(){
			this.lastViewedListContainer.style.display= "none";
		}
		
		this.show = function(){
			this.lastViewedListContainer.style.display= "flex";
		}
		this.reset = function(){
			this.lastViewedBody.innerHTML = "";
		}
		
	}
	function ContextHandler(leftBanner, buy, sell, rightBanner){
		this.leftBanner = leftBanner;
		this.buy = buy;
		this.sell = sell;
		this.rightBanner = rightBanner;
		
		this.start = function(){
			leftBanner.addEventListener("click", (e) =>{
					contextHandler.showSell();
				}, false);
			rightBanner.addEventListener("click", (e) =>{
				contextHandler.showBuy();
			}, false);
			if(cookieHandler.getCookie("context") == "" || cookieHandler.getCookie("context") =="compro"){
				this.showBuy();
			} else {
				this.showSell();
			}
		}
		this.showSell = function(){
			this.sell.style.display = "block";
			this.rightBanner.style.display = "block";
			this.leftBanner.style.display = "none";
			this.buy.style.display = "none";
		}
		this.showBuy = function(){
			this.leftBanner.style.display = "block";
			this.buy.style.display = "block";
			this.sell.style.display = "none";
			this.rightBanner.style.display = "none";
		}
		
	}
	
	function CreateAuctionWizard (wizard, alert){
		var now = new Date().getTime()+Number(2*1000*60*60);
		var nowCEST = new Date(now);
		var formattedDate = nowCEST.toISOString().substring(0,16);
		this.wizard = wizard;
		this.alert = alert;
		this.wizard.querySelector('input[type="datetime-local"]').setAttribute("min", formattedDate);
		
		this.registerEvents = function(pageOrchestrator){
			
			Array.from(this.wizard.querySelectorAll("input[type='button'].next, input[type='button'].prev")).forEach(button => {
				
				button.addEventListener("click", (e)=>{
					var eventFieldset = e.target.closest("fieldset"),
						valid = true;
					
					if(e.target.className =="next"){
						for(let i =0; i< eventFieldset.elements.length; i++){
							if(!eventFieldset.elements[i].checkValidity()){
								valid = false;
								break;
							}
						}
					}
					if(valid){
						this.changeStep(e.target.parentNode, (e.target.className === "next") ? e.target.parentNode.nextElementSibling : e.target.parentNode.previousElementSibling);
					}
					
				},false);
			});
			
			
			this.wizard.querySelector("input[type=button].cancel").addEventListener('click', (e) =>{
				e.target.closest('form').reset();
				this.reset();
			});
			
			
			this.wizard.querySelector("input[type=button].submit").addEventListener('click', (e) =>{
				var eventFieldset = e.target.closest("fieldset"),
					valid = true;
				for(let i =0; i< eventFieldset.elements.length; i++){
							if(!eventFieldset.elements[i].checkValidity()){
								eventFieldset.elements[i].reportValidity();
								valid = false;
								break;
							}
				}
				if(valid){
					var self = this;
					makeCall("POST", "CreateAuction", e.target.closest("form"),
						function(req){
							if(req.readyState == XMLHttpRequest.DONE) {
								var message = req.responseText;
								if(req.status ==200){
									cookieHandler.setContextCookie("vendo");
									pageOrchestrator.updateMySellAuctions();
									self.reset();
								} else if(req.status ==403){
									window.location.href = req.getResponseHeader("Location");
									window.sessionStorage.removeItem('username');
								} else {
									self.alert.textContent = message;
									self.reset();
								}
							}	
						}
					);
				}
					
			});
				
			
			
			
		};
		
		this.reset = function(){
			var fieldsets = document.querySelectorAll("#"+this.wizard.id+" fieldset");
			fieldsets[0].hidden = false;
			fieldsets[1].hidden = true;
			fieldsets[2].hidden = true;
			fieldsets[3].hidden = true;
		}
		
		this.changeStep = function(origin, destination){
			origin.hidden = true;
			destination.hidden = false;
		}
		
		
		
		
	}
	
    function PageOrchestrator(){

        this.start = function() {
			cookieHandler = new CookieHandler(document.getElementById("lastViewedlist"), document.getElementById("lastViewedBody"));
			cookieHandler.start();
			cookieHandler.showRecentList();
			contextHandler = new ContextHandler(document.getElementById("leftBanner"), document.getElementById("buy"),document.getElementById("sell"),document.getElementById("rightBanner"));
            contextHandler.start();
			searchAuctions = new SearchAuctionsForm (document.getElementById("searchForm"), document.getElementById("searchAlert"));
            searchAuctions.registerEvents(this);
			searchedList = new SearchedList(document.getElementById("searchListBody"), document.getElementById("searchListContainer"));
			searchedList.reset();
			myWonAuctions = new MyWonAuctions(document.getElementById("wonAuctions"), document.getElementById("wonAuctionsTable"), document.getElementById("wonAuctionsBody"), document.getElementById("wonAuctionsAlert"));
			myWonAuctions.show();

			buyAuctionInfo = new BuyAuctionInfo(document.getElementById("buyAuctionInfo"), document.getElementById("buyInfo"), document.getElementById("buyAuctionInfoTableBody") , 
												document.getElementById("buyAuctionBids"), document.getElementById("buyAuctionBidsTable"), document.getElementById("buyAuctionsBidsBody"),document.getElementById("noBuyAuctionBids"),document.getElementById("buyAuctionInfoAlert"),
												document.getElementById("makeBidForm"),document.getElementById("makeBidFormInput"),document.getElementById("makeBidFormCodArt"),document.getElementById("makeBidAlert"));
			buyAuctionInfo.registerMakeBidEvents(this);
			buyAuctionInfo.reset();
			myOpenAuctions = new MyOpenAuctions(document.getElementById("openAuctionListContainer"),document.getElementById("openAuctionListTable"),document.getElementById("openAuctionListBody"),document.getElementById("sellOpenAuctionsListAlert"));
			myClosedAuctions = new MyClosedAuctions(document.getElementById("closedAuctionListContainer"),document.getElementById("closedAuctionListTable"),document.getElementById("closedAuctionListBody"),document.getElementById("sellClosedAuctionsListAlert"));
        	myOpenAuctions.update();
			myClosedAuctions.update();
			sellAuctionInfo = this.createSellAuctionInfo();
			sellAuctionInfo.registerCloseAuctionEvents(this);
			sellAuctionInfo.hide();
			createAuctionWizard = new CreateAuctionWizard(document.getElementById("createAuctionWizard"),document.getElementById("createAuctionAlert"))
			createAuctionWizard.registerEvents(this);
			createAuctionWizard.reset();
			
			document.querySelector("a[href='LogOut']").addEventListener('click', () => {
				window.sessionStorage.removeItem('username');
			});
		};

        this.refreshSearchList = function(auctions) {
			searchedList.update(auctions);
			searchedList.show();

        };
		
		this.updateMySellAuctions = function(){
			myOpenAuctions.update();
			myClosedAuctions.update();
			
		}

		this.createSellAuctionInfo = function(){
			let sellAuctionInfoContainer = document.getElementById("sellAuctionInfo");
			let sellAuctionInfo = new Object();
			let sellAuctionBids = new Object();
			let closeAuctionForm = new Object();
			let winnerAuctionInfo = new Object();
			sellAuctionInfo.container = document.getElementById("sellInfo");
			sellAuctionInfo.alert =  document.getElementById("sellAuctionInfoAlert");
			sellAuctionInfo.table =  document.getElementById("sellAuctionInfoTable");
			sellAuctionInfo.nomeArt =  document.getElementById("sellAuctionInfoTableBodyNomeArt");
			sellAuctionInfo.description =  document.getElementById("sellAuctionInfoTableBodyDescription");
			sellAuctionInfo.startingPrice =  document.getElementById("sellAuctionInfoTableBodyStartingPrice");
			sellAuctionInfo.minimumRaise =  document.getElementById("sellAuctionInfoTableBodyMinimumRaise");
			sellAuctionInfo.expDate =  document.getElementById("sellAuctionInfoTableBodyExpDate");
			sellAuctionInfo.img =  document.getElementById("sellAuctionInfoImg");
			
			sellAuctionBids.container = document.getElementById("sellAuctionBidsContainer");
			sellAuctionBids.alert = document.getElementById("sellAuctionBidsAlert");
			sellAuctionBids.table = document.getElementById("sellAuctionBidsTable");
			sellAuctionBids.body = document.getElementById("sellAuctionBidsBody");
			
			closeAuctionForm.container = document.getElementById("closeAuctionFormContainer");
			closeAuctionForm.alert = document.getElementById("closeAuctionInfoAlert");
			closeAuctionForm.form = document.getElementById("closeAuctionForm");
			closeAuctionForm.input = document.getElementById("closeAuctionInput");
			
			winnerAuctionInfo.container = document.getElementById("winnerAuctionInfoContainer");
			winnerAuctionInfo.alert = document.getElementById("winnerAuctionInfoAlert");
			winnerAuctionInfo.table = document.getElementById("winnerAuctionInfoTable");
			winnerAuctionInfo.username = document.getElementById("usernameWinner");
			winnerAuctionInfo.spedInfo = document.getElementById("spedInfoWinner");
			winnerAuctionInfo.bid = document.getElementById("winnerBid");
			
			
			
			return new SellAuctionInfo(sellAuctionInfoContainer, sellAuctionInfo, sellAuctionBids, closeAuctionForm, winnerAuctionInfo);
		};
    }
})();