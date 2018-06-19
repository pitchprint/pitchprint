PITCHPRINT PRODUCT CUSTOMIZATION PLUGIN


= Changelog - 16/03/2015 =
* Major upgrade on both server side and client app which includes:
* Setting loaded Image as Bakcground
* New Nginx and NodeJS based servers for faster scaling
* Variable Data plugin to allow for CSV / Excel sheet uploads which generates products based on the number of rows in the file
* Canvas Adjuster gives customers ability to adjust the canvas at design time or before design
* Color Templates module makes users change template images like TShirt colors within a project design
* Global Instagram App without need for registering your own Instagram App
* Design based default text color
* Create multiple layouts and assign layouts based on designs
* Custom PDF Rendering based on requests
* New Image editor from Adobe Creative Cloud
* Security fixes limiting files that can be uploaded to non-executables
* Streamlined Image Tab with Customer Uploads on a separate tab and option to select default Image tab. This is useful for designs that by default requires users to upload their pictures. So the first tab they get to see is Upload your Picture
* Pixabay Image library search
* Javascripts and stylesheets now loads from Amazon cloud CDN for faster edge delivery
* Free anual premium license for Charities and NGOs

= Minor modifications ==
* Render PDF, Render Raster has been removed. By default, all projects have PDFs rendered while Raster PNG images are generated off the PDF at high resolution based on demand (i.e when you click to download Raster).

=== Version 8.0.0 - 12/09/2015 ===
* New App build based on Box' T3 Framework (http://t3js.org), so your old layout files will automatically be replaced, but all project and designs will load seamlessly well.
* Added TextBox element
* New Text-Styles feature that allows grouped text and shapes to be added and edited by customers.
* Help system
* Customer can now add their own custom colors
* App loads inline within the page, and of course you still have the option to pop it on a modal window.
* App can load on startup
* Ability to create your own modules and attach to the App using events
* New Form Data module
* In-Context text editor
* App loads way faster with improved caching
* Theme caching is improved so them changes are reflected instantly
* We migrated a lot of static files to CDN, notably the language files
* Improved and Faster PDF generation using more primed servers
* PDF cut lines are now rendered correctly, far off the bleed area
* Lots of bug fixes and optimizations

= 8.2.0 - 01/03/2016 =
* Upgrade to new and faster API 8.2.0
* Fixed bug with preview thumbnails not showing
* Other minor bug fixes

= 8.2.1 - 03/04/2016 =
* Escape slashes for names and addresses with aprostophes
* Expanded user data to include addresses and full name
* Other minor bug fixes

= 9.0.0 - 29/03/2018 =
* Version 9 requires a migration of data from the existing 8.x
* Navigate to https://pitchprint.net/admin/domains and migrate your existing store data there
* Or if you are a new user, kindly create a new account here: https://admin.pitchprint.net/register

=== INSTALLATION ===
INSTALLATION INSTRUCTIONS CAN BE FOUND HERE: https://docs.pitchprint.com
	
=== UPGRADES ===
To upgrade, first uninstall the old module through your admin, then upload the files in the files into your modules/pitchprint/ directory and install the new module.
You may need to re-enter your API and Secret Keys as well as re-assign your designs to products, please check and ensure everything works fine.

=== SUPPORT ====
FOR SUPPORT AND ISSUES, KINDLY CREATE A TICKET HERE:
http://support.pitchprint.com/support/tickets/new