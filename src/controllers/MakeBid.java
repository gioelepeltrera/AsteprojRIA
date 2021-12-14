package controllers;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.lang.StringEscapeUtils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import beans.Auction;
import beans.AuctionStats;
import beans.HighestBidder;
import beans.User;
import dao.AuctionDAO;
import dao.BidDAO;
import utils.ConnectionHandler;

/**
 * Servlet implementation class MakeBid
 */
@WebServlet("/MakeBid")
@MultipartConfig

public class MakeBid extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private Connection connection = null;
  
    /**
     * @see HttpServlet#HttpServlet()
     */
    public MakeBid() {
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
		doPost(request, response);

	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String codArt = null;
		String value = null;
		codArt = StringEscapeUtils.escapeJava(request.getParameter("codArt"));
		value = StringEscapeUtils.escapeJava(request.getParameter("value"));
		HttpSession s = request.getSession(false);
		User u = (User) s.getAttribute("user");
		Auction auction = null;
		try {
			AuctionDAO aDAO = new AuctionDAO(connection);
			auction = aDAO .getAstaInfo(Integer.parseInt(codArt));
			if(auction == null || u.getId() == auction.getIdUser() || value ==null ) {
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				response.getWriter().println("Invalid parameters, cannot make bid for this auction");
				return;
			}
			if(auction.isOpen() && !auction.isClosable()) {
				
				BidDAO bDAO = new BidDAO(connection);
				HighestBidder hB = bDAO.getAuctionHighestBidder( Integer.parseInt(codArt));
				float min = auction.getMinimumRaise();
				float minRaise = min;
				if(hB != null) {
					min += hB.getFinalBid();
				}else {
					min = auction.getStartingPrice();
				}
				if(Float.parseFloat(value) >= min) {
					int code = bDAO.makeBid(u.getId(), Integer.parseInt(codArt), Float.parseFloat(value));
					if(code != 1) {
						response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
						response.getWriter().println("Error in dataBase making bid");
						return;
					}
				} else {
					response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
					response.getWriter().println("Invalid bid, value too low");
					return;
				}
			} else {
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				response.getWriter().println("This Auction is closed");
				return;
				
			}
			
		} catch(SQLException e ) {
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			response.getWriter().println("Failure making bid");
			return;
		} catch(NumberFormatException e ) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Incompatible parameters");
			return;
			
		}
		
		Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm").create();
		JsonObject jobj = new JsonObject();
		jobj.addProperty("codArt", codArt);
		jobj.addProperty("minBid", Float.parseFloat(value)+auction.getMinimumRaise());
				
		String json = gson.toJson(jobj);

		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");
		response.getWriter().write(json);

	}

	public void destroy() {
		try {
			ConnectionHandler.closeConnection(connection);
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}
}
