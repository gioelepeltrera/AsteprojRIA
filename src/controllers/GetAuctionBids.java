package controllers;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import beans.Auction;
import beans.AuctionBid;
import beans.User;
import dao.AuctionDAO;
import dao.BidDAO;
import utils.ConnectionHandler;

/**
 * Servlet implementation class GetAuctionBids
 */
@WebServlet("/GetAuctionBids")
public class GetAuctionBids extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private Connection connection = null;
   
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GetAuctionBids() {
        super();
        // TODO Auto-generated constructor stub
    }
    public void init() throws ServletException {
    	connection = ConnectionHandler.getConnection(getServletContext());
    }
	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		HttpSession s = request.getSession(false);
		User u = (User) s.getAttribute("user");
		String codArt = request.getParameter("codArt");
		List<AuctionBid> aucBids = null;
		AuctionDAO aDAO = new AuctionDAO(connection);
		BidDAO bidDAO = new BidDAO(connection);

		Auction auction = new Auction();
		try {
			auction = aDAO.getAstaInfo(Integer.parseInt(codArt));
			if(auction ==null) {
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				response.getWriter().println("Invalid parameters, cannot access to this page");
				return;
			}
			if(auction.isOpen()) {
				aucBids = bidDAO.getAuctionBids(Integer.parseInt(codArt));
				BidDAO bDAO = new BidDAO(connection);
				
			} else {
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				response.getWriter().println("Invalid parameters, cannot access to this page");
				return;
			}
			
			
		} catch(SQLException e ) {
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			response.getWriter().println("Internal server error searching auction info");
			return;
			
		} catch(NumberFormatException e ) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Incompatible parameters");
			return;
		}

		Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm").create();
		String json = gson.toJson(aucBids);
		
		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");
		response.getWriter().write(json);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}
	public void destroy() {
		try {
			ConnectionHandler.closeConnection(connection);
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}
}
