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

import beans.Auction;
import beans.User;
import dao.AuctionDAO;
import utils.ConnectionHandler;

/**
 * Servlet implementation class CloseAuction
 */
@WebServlet("/CloseAuction")
@MultipartConfig
public class CloseAuction extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private Connection connection = null;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public CloseAuction() {
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
		codArt = StringEscapeUtils.escapeJava(request.getParameter("codArt"));
		HttpSession s = request.getSession(false);
		User u = (User) s.getAttribute("user");
		if( codArt == null || codArt.isEmpty()) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Invalid parameter");
			return;
		}
		AuctionDAO aDAO = new AuctionDAO(connection);
		Auction auction = new Auction();
		try {
			auction = aDAO.getAstaInfo(Integer.parseInt(codArt));
			if(auction == null || u.getId() != auction.getIdUser()) {
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				response.getWriter().println("Invalid parameters");
				return;
			}
			if(auction.isOpen() && auction.isClosable()) {
				int code = aDAO.closeAuction(Integer.parseInt(codArt));
				if(code != 1) {
					response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
					response.getWriter().println("Internal server error closing auction");
					return;
				}
			} else {
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				response.getWriter().println("Invalid parameters");
				return;			}
		
			
		} catch(SQLException e ) {
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			response.getWriter().println("Internal server error closing auction");
			return;
			
		} catch(NumberFormatException e ) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Incompatible parameters");
			return;
		}
		Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm").create();
		String json = gson.toJson(auction);
		response.setContentType("application/json");
		response.setCharacterEncoding("UTF-8");
		response.getWriter().write(json);
		System.out.println("CLOSED");

	}
	public void destroy() {
		try {
			ConnectionHandler.closeConnection(connection);
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}
}
