package com.janseva.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "locations")
public class LocationRecord extends TimestampedEntity {

    @Column(name = "grievance_id", unique = true)
    @JsonProperty("grievance_id")
    private Long grievanceId;

    @Column(name = "location_text", nullable = false)
    @JsonProperty("location_text")
    private String locationText;

    private Double latitude;
    private Double longitude;
    private String address;
    private String city;
    private String state;

    public LocationRecord() {}

    public Long getGrievanceId() { return grievanceId; }
    public void setGrievanceId(Long grievanceId) { this.grievanceId = grievanceId; }

    public String getLocationText() { return locationText; }
    public void setLocationText(String locationText) { this.locationText = locationText; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
