package controllers;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.http.Part;

import org.apache.commons.lang.StringEscapeUtils;

import beans.User;
import dao.AuctionDAO;
import utils.ConnectionHandler;

/**
 * Servlet implementation class CreateAuction
 */
@WebServlet("/CreateAuction")
@MultipartConfig
public class CreateAuction extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private Connection connection = null;
  
    /**
     * @see HttpServlet#HttpServlet()
     */
    public CreateAuction() {
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
		response.getWriter().append("Served at: ").append(request.getContextPath());
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession s = request.getSession(false);
		User u = (User) s.getAttribute("user");
		String name = StringEscapeUtils.escapeJava(request.getParameter("name"));
		String description = StringEscapeUtils.escapeJava(request.getParameter("description"));
		InputStream imageStream = null;
		String mimeType = null;
		Part imagePart = request.getPart("image");
		if(imagePart != null) {
			imageStream = imagePart.getInputStream();
			String filename = imagePart.getSubmittedFileName();
			mimeType = getServletContext().getMimeType(filename);
		}
		String startingPrice = StringEscapeUtils.escapeJava(request.getParameter("startingprice"));
		String minimumRaise = StringEscapeUtils.escapeJava(request.getParameter("minimumraise"));
		String expirationDate = StringEscapeUtils.escapeJava(request.getParameter("expirationdate"));
		
		
		Float startingPriceF = 0F ;
		Float minimumRaiseF = 0F;
		try {
			startingPriceF = Float.parseFloat(startingPrice);
			minimumRaiseF = Float.parseFloat(minimumRaise);
		} catch(NumberFormatException e) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Bad parameters in auction creation");
			return;
		}
		if (name == null || name.isEmpty() || description == null || description.isEmpty() || 
				imageStream == null || (imageStream.available()==0) || !mimeType.startsWith("image/") || 
				startingPrice == null || startingPrice.isEmpty() || Float.parseFloat(startingPrice)<=0 ||
				minimumRaise == null || minimumRaise.isEmpty() || Float.parseFloat(minimumRaise)<=0 ||
				expirationDate == null || expirationDate.isEmpty()) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Invalid parameters");
			return;
		}
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm"); 
		Date expDate;
		try {
			expDate = sdf.parse(expirationDate);
			Date now = new Date();
			if(expDate.before(now)) {
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				response.getWriter().println("Past expiration date in auction creation");
				return;
			}
		} catch (ParseException e) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Bad parameters for date in auction creation");
			return;
		}
		AuctionDAO aDAO = new AuctionDAO(connection);

		try {
			int res = aDAO.createAuction(u.getId(), name, description, imageStream, startingPriceF, minimumRaiseF, expirationDate);
			
		} catch(SQLException e ) {
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			response.getWriter().println("Internal server error creating auction");
			return;
			
		} catch(NumberFormatException e ) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			response.getWriter().println("Incompatible parameters");
			return;
		}
		
	}
	public void destroy() {
		try {
			ConnectionHandler.closeConnection(connection);
		} catch (SQLException e) {
			e.printStackTrace();
		}
	}
}
