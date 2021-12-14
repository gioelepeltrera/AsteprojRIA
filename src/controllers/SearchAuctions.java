package controllers;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Date;
import java.util.List;

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

import beans.AuctionStats;
import beans.User;
import dao.AuctionDAO;
import utils.ConnectionHandler;

/**
 * Servlet implementation class SearchAuctions
 */
@WebServlet("/SearchAuctions")
@MultipartConfig
public class SearchAuctions extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private Connection connection = null;

    /**
     * @see HttpServlet#HttpServlet()
     */
    public SearchAuctions() {
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
		String keyword = null;
		keyword = StringEscapeUtils.escapeJava(request.getParameter("keyword"));
		HttpSession s = request.getSession(false);
		User u = (User) s.getAttribute("user");
		if( keyword == null || keyword.isEmpty()) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Invalid keyword");
			return;
		}
		List<AuctionStats> searchResult = null;
		AuctionDAO aDAO = new  AuctionDAO(connection);
		try {
			searchResult = aDAO.searchAuction(keyword, u.getId());
			for(AuctionStats as : searchResult) {
				Date now = new Date();
				as.calculateDaysLeft(now);
				as.calculateHoursLeft(now);
				as.calculateMinutesLeft(now);
			}
		}  catch (SQLException e) {
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			response.getWriter().println("Internal server error searching auctions");
			
			return;
		}
		Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd'T'HH:mm").create();
		String json = gson.toJson(searchResult);
		
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
